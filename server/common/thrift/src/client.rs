use crate::auth;
use service_errors::{
    Fault, FaultKind, FieldViolation, PublicCode, PublicError, PublicResource, ValidationCode,
};
use telemetry::{OpenTelemetrySpanExt, RpcCompletion};
use tracing::Instrument;
use volo_thrift::MaybeException;

#[derive(Debug, thiserror::Error)]
pub enum RpcError {
    #[error("authentication request rejected")]
    Rejected(PublicError),
    #[error("authentication service failed")]
    Remote(PublicError),
    #[error(transparent)]
    Local(#[from] Fault),
}
impl RpcError {
    pub fn public_error(self) -> PublicError {
        match self {
            Self::Rejected(value) | Self::Remote(value) => value,
            Self::Local(fault) => {
                telemetry::record_fault(&fault);
                public(fault.public_code())
            }
        }
    }
}
fn public(code: PublicCode) -> PublicError {
    PublicError::new(
        code,
        telemetry::current_correlation()
            .unwrap_or_default()
            .request_id,
    )
}
fn protocol() -> RpcError {
    Fault::new(FaultKind::Protocol, "auth_reply", InvalidReply).into()
}
#[derive(Debug, thiserror::Error)]
#[error("invalid authentication RPC reply")]
struct InvalidReply;

fn rejection(value: auth::AuthRejected, allowed: &[auth::AuthRejectionCode]) -> RpcError {
    use auth::AuthRejectionCode as C;
    if value.code != C::INVALID_REQUEST && !allowed.contains(&value.code) {
        return protocol();
    }
    let code = match value.code {
        C::UNAUTHENTICATED => PublicCode::Unauthenticated,
        C::REAUTH_REQUIRED => PublicCode::ReauthRequired,
        C::AUTHENTICATION_FAILED => PublicCode::AuthenticationFailed,
        C::CEREMONY_INVALID => PublicCode::CeremonyInvalid,
        C::NO_PASSKEY => PublicCode::NoPasskey,
        C::PASSKEY_EXISTS => PublicCode::PasskeyExists,
        C::INVALID_REQUEST => PublicCode::InvalidRequest,
        C::NOT_FOUND => PublicCode::NotFound,
        C::RATE_LIMITED => PublicCode::RateLimited,
        _ => return protocol(),
    };
    let mut error = public(code);
    if code == PublicCode::RateLimited {
        let Some(seconds) = value.retry_after_seconds.filter(|seconds| *seconds >= 0) else {
            return protocol();
        };
        error.retry_after_seconds = Some(seconds as u32);
    } else if value.retry_after_seconds.is_some() {
        return protocol();
    }
    if let Some(fields) = value.field_errors {
        if code != PublicCode::InvalidRequest || fields.is_empty() {
            return protocol();
        }
        let Some(fields) = fields.into_iter().map(field).collect::<Option<Vec<_>>>() else {
            return protocol();
        };
        error.field_errors = Some(fields);
    }
    if let Some(id) = value.resource_id {
        if code != PublicCode::NotFound {
            return protocol();
        }
        let Ok(id) = uuid::Uuid::parse_str(id.as_str()) else {
            return protocol();
        };
        error.resources = Some(vec![PublicResource {
            kind: "PASSKEY",
            id: id.to_string(),
        }]);
    }
    RpcError::Rejected(error)
}
fn field(value: auth::FieldViolation) -> Option<FieldViolation> {
    // These paths refer to RPC arguments, never arbitrary remote text or credential fields.
    if value.path.len() != 1
        || !matches!(
            value.path[0].as_str(),
            "username"
                | "password"
                | "name"
                | "id"
                | "credentialJson"
                | "ceremonyId"
                | "browserBinding"
                | "sessionToken"
        )
    {
        return None;
    }
    let code = match value.code {
        auth::ValidationCode::REQUIRED => ValidationCode::Required,
        auth::ValidationCode::INVALID_FORMAT => ValidationCode::InvalidFormat,
        auth::ValidationCode::TOO_LONG => ValidationCode::TooLong,
        auth::ValidationCode::OUT_OF_RANGE => ValidationCode::OutOfRange,
        _ => return None,
    };
    Some(FieldViolation {
        path: value
            .path
            .into_iter()
            .map(|part| {
                if part == "credentialJson" {
                    "credential".into()
                } else {
                    part.to_string()
                }
            })
            .collect(),
        code,
        min: value.min,
        max: value.max,
    })
}
fn remote(value: auth::ServiceFault) -> RpcError {
    let code = match value.code {
        auth::ServiceFaultCode::INTERNAL => PublicCode::Internal,
        auth::ServiceFaultCode::UNAVAILABLE => PublicCode::Unavailable,
        auth::ServiceFaultCode::DEADLINE_EXCEEDED => PublicCode::UpstreamTimeout,
        _ => return protocol(),
    };
    let error = public(code);
    if error.request_id != value.request_id.as_str() {
        return protocol();
    }
    RpcError::Remote(error)
}
impl From<volo_thrift::ClientError> for RpcError {
    fn from(source: volo_thrift::ClientError) -> Self {
        let kind = match &source {
            volo_thrift::ClientError::Transport(error)
                if error.kind() == std::io::ErrorKind::TimedOut =>
            {
                FaultKind::Timeout
            }
            volo_thrift::ClientError::Transport(_) => FaultKind::Network,
            _ => FaultKind::Protocol,
        };
        Fault::new(kind, "auth_rpc", source).into()
    }
}
macro_rules! exception {
    ($name:ident, [$($code:ident),*]) => {
        impl From<auth::$name> for RpcError {
            fn from(value: auth::$name) -> Self {
                match value {
                    auth::$name::Rejected(value) => rejection(value, &[$(auth::AuthRejectionCode::$code),*]),
                    auth::$name::Fault(value) => remote(value),
                }
            }
        }
    };
}
exception!(
    AuthServiceLoginPasswordException,
    [AUTHENTICATION_FAILED, RATE_LIMITED]
);
exception!(AuthServiceCheckException, [UNAUTHENTICATED]);
exception!(AuthServiceLogoutException, []);
exception!(
    AuthServiceReauthPasswordException,
    [UNAUTHENTICATED, AUTHENTICATION_FAILED, RATE_LIMITED]
);
exception!(
    AuthServiceBeginLoginException,
    [NO_PASSKEY, RATE_LIMITED, CEREMONY_INVALID]
);
exception!(
    AuthServiceFinishLoginException,
    [CEREMONY_INVALID, AUTHENTICATION_FAILED]
);
exception!(
    AuthServiceBeginReauthException,
    [UNAUTHENTICATED, NO_PASSKEY, RATE_LIMITED, CEREMONY_INVALID]
);
exception!(
    AuthServiceFinishReauthException,
    [UNAUTHENTICATED, CEREMONY_INVALID, AUTHENTICATION_FAILED]
);
exception!(AuthServiceListPasskeysException, [UNAUTHENTICATED]);
exception!(
    AuthServiceBeginRegistrationException,
    [
        UNAUTHENTICATED,
        REAUTH_REQUIRED,
        RATE_LIMITED,
        CEREMONY_INVALID
    ]
);
exception!(
    AuthServiceFinishRegistrationException,
    [
        UNAUTHENTICATED,
        REAUTH_REQUIRED,
        CEREMONY_INVALID,
        AUTHENTICATION_FAILED,
        PASSKEY_EXISTS
    ]
);
exception!(
    AuthServiceRenamePasskeyException,
    [UNAUTHENTICATED, REAUTH_REQUIRED, NOT_FOUND]
);
exception!(
    AuthServiceDeletePasskeyException,
    [UNAUTHENTICATED, REAUTH_REQUIRED]
);

pub struct AuthClient(pub(crate) auth::AuthServiceClient);
fn client_span() -> tracing::Span {
    let span = tracing::info_span!(target: "telemetry", "auth.rpc.client", otel.kind = "client");
    // Direct internal callers without an HTTP request still receive valid correlation.
    if telemetry::current_correlation().is_none() {
        let (root, _) = telemetry::extract(
            &telemetry::PropagationFields::default(),
            telemetry::IngressTrust::Internal,
        );
        let _ = span.set_parent(root);
    }
    span
}
/// Construct the business part of a Context; the client fills propagation from its own span.
pub fn context(session_token: Option<String>) -> auth::Context {
    auth::Context {
        trace_parent: "".into(),
        request_id: "".into(),
        trace_state: None,
        session_token: session_token.map(Into::into),
    }
}
fn propagate(context: &mut auth::Context, span: &tracing::Span) {
    let otel = span.context();
    let correlation = otel
        .get::<telemetry::RequestCorrelation>()
        .cloned()
        .unwrap_or_default();
    let fields = telemetry::inject(&otel, &correlation);
    context.trace_parent = fields.traceparent.into();
    context.request_id = fields.request_id.into();
    context.trace_state = fields.tracestate.map(Into::into);
}
async fn invoke<T, E: Into<RpcError>>(
    method: &'static str,
    span: tracing::Span,
    future: impl std::future::Future<Output = Result<MaybeException<T, E>, volo_thrift::ClientError>>,
) -> Result<T, RpcError> {
    let mut completion = RpcCompletion::new(span.clone(), method);
    async {
        let result = match tokio::time::timeout(std::time::Duration::from_secs(10), future).await {
            Ok(Ok(MaybeException::Ok(value))) => Ok(value),
            Ok(Ok(MaybeException::Exception(value))) => Err(value.into()),
            Ok(Err(source)) => Err(source.into()),
            Err(source) => Err(Fault::new(FaultKind::Timeout, "auth_rpc_deadline", source).into()),
        };
        match &result {
            Ok(_) => completion.finish("success", None),
            Err(RpcError::Rejected(error)) => {
                completion.finish("rejected", Some(error.code.as_str()))
            }
            Err(RpcError::Remote(error)) => completion.finish("fault", Some(error.code.as_str())),
            Err(RpcError::Local(error)) => {
                completion.finish("transport_error", Some(error.public_code().as_str()))
            }
        }
        result
    }
    .instrument(span)
    .await
}

impl AuthClient {
    pub async fn ready(&self) -> Result<bool, volo_thrift::ClientError> {
        self.0.ready().await
    }
    pub async fn login_password(
        &self,
        mut ctx: auth::Context,
        username: volo::FastStr,
        password: volo::FastStr,
    ) -> Result<auth::LoginResult, RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke(
            "LoginPassword",
            span,
            self.0.login_password(ctx, username, password),
        )
        .await
    }
    pub async fn check(&self, mut ctx: auth::Context) -> Result<auth::Session, RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke("Check", span, self.0.check(ctx)).await
    }
    pub async fn logout(&self, mut ctx: auth::Context) -> Result<(), RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke("Logout", span, self.0.logout(ctx)).await
    }
    pub async fn reauth_password(
        &self,
        mut ctx: auth::Context,
        password: volo::FastStr,
    ) -> Result<auth::Session, RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke(
            "ReauthPassword",
            span,
            self.0.reauth_password(ctx, password),
        )
        .await
    }
    pub async fn begin_login(
        &self,
        mut ctx: auth::CeremonyContext,
    ) -> Result<auth::Options, RpcError> {
        let span = client_span();
        propagate(&mut ctx.context, &span);
        invoke("BeginLogin", span, self.0.begin_login(ctx)).await
    }
    pub async fn finish_login(
        &self,
        mut ctx: auth::CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<auth::LoginResult, RpcError> {
        let span = client_span();
        propagate(&mut ctx.context, &span);
        invoke(
            "FinishLogin",
            span,
            self.0.finish_login(ctx, credential_json),
        )
        .await
    }
    pub async fn begin_reauth(
        &self,
        mut ctx: auth::CeremonyContext,
    ) -> Result<auth::Options, RpcError> {
        let span = client_span();
        propagate(&mut ctx.context, &span);
        invoke("BeginReauth", span, self.0.begin_reauth(ctx)).await
    }
    pub async fn finish_reauth(
        &self,
        mut ctx: auth::CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<auth::Session, RpcError> {
        let span = client_span();
        propagate(&mut ctx.context, &span);
        invoke(
            "FinishReauth",
            span,
            self.0.finish_reauth(ctx, credential_json),
        )
        .await
    }
    pub async fn list_passkeys(
        &self,
        mut ctx: auth::Context,
    ) -> Result<Vec<auth::PasskeyInfo>, RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke("ListPasskeys", span, self.0.list_passkeys(ctx)).await
    }
    pub async fn begin_registration(
        &self,
        mut ctx: auth::CeremonyContext,
        name: volo::FastStr,
    ) -> Result<auth::Options, RpcError> {
        let span = client_span();
        propagate(&mut ctx.context, &span);
        invoke(
            "BeginRegistration",
            span,
            self.0.begin_registration(ctx, name),
        )
        .await
    }
    pub async fn finish_registration(
        &self,
        mut ctx: auth::CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<auth::PasskeyInfo, RpcError> {
        let span = client_span();
        propagate(&mut ctx.context, &span);
        invoke(
            "FinishRegistration",
            span,
            self.0.finish_registration(ctx, credential_json),
        )
        .await
    }
    pub async fn rename_passkey(
        &self,
        mut ctx: auth::Context,
        id: volo::FastStr,
        name: volo::FastStr,
    ) -> Result<auth::PasskeyInfo, RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke("RenamePasskey", span, self.0.rename_passkey(ctx, id, name)).await
    }
    pub async fn delete_passkey(
        &self,
        mut ctx: auth::Context,
        id: volo::FastStr,
    ) -> Result<auth::DeletePasskeyResult, RpcError> {
        let span = client_span();
        propagate(&mut ctx, &span);
        invoke("DeletePasskey", span, self.0.delete_passkey(ctx, id)).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn rejected(code: auth::AuthRejectionCode) -> auth::AuthRejected {
        auth::AuthRejected {
            code,
            retry_after_seconds: None,
            field_errors: None,
            resource_id: None,
        }
    }
    #[test]
    fn only_method_allowed_rejections_and_valid_details_cross_the_boundary() {
        let value = auth::AuthServiceCheckException::Rejected(rejected(
            auth::AuthRejectionCode::UNAUTHENTICATED,
        ));
        assert!(
            matches!(RpcError::from(value), RpcError::Rejected(error) if error.code == PublicCode::Unauthenticated)
        );
        let value = auth::AuthServiceCheckException::Rejected(rejected(
            auth::AuthRejectionCode::AUTHENTICATION_FAILED,
        ));
        assert!(
            matches!(RpcError::from(value), RpcError::Local(error) if error.kind == FaultKind::Protocol)
        );
        let value = auth::AuthServiceLoginPasswordException::Rejected(rejected(
            auth::AuthRejectionCode::RATE_LIMITED,
        ));
        assert!(matches!(RpcError::from(value), RpcError::Local(_)));
        let mut value = rejected(auth::AuthRejectionCode::NOT_FOUND);
        value.resource_id = Some("private user content".into());
        assert!(matches!(
            RpcError::from(auth::AuthServiceRenamePasskeyException::Rejected(value)),
            RpcError::Local(_)
        ));
        let mut value = rejected(auth::AuthRejectionCode::INVALID_REQUEST);
        value.field_errors = Some(vec![auth::FieldViolation {
            path: vec!["secret text".into()],
            code: auth::ValidationCode::REQUIRED,
            min: None,
            max: None,
        }]);
        assert!(matches!(
            RpcError::from(auth::AuthServiceCheckException::Rejected(value)),
            RpcError::Local(_)
        ));
    }
    #[test]
    fn transport_timeout_is_distinct_and_keeps_its_typed_source() {
        for (kind, expected) in [
            (std::io::ErrorKind::TimedOut, FaultKind::Timeout),
            (std::io::ErrorKind::ConnectionRefused, FaultKind::Network),
        ] {
            let value =
                volo_thrift::ClientError::from(std::io::Error::new(kind, "secret endpoint"));
            let RpcError::Local(error) = RpcError::from(value) else {
                panic!("local fault expected");
            };
            assert_eq!(error.kind, expected);
            assert!(
                error
                    .source
                    .downcast_ref::<volo_thrift::ClientError>()
                    .is_some()
            );
            assert!(!format!("{error:?}").contains("secret"));
        }
    }
}
