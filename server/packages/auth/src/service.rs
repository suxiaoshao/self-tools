use crate::{
    application::Application,
    domain,
    error::{Error, Rejection},
    passkey::Purpose,
};
use std::sync::Arc;
use telemetry::{IngressTrust, OpenTelemetrySpanExt, PropagationFields, RpcCompletion};
use thrift::auth::*;
use tracing::Instrument;
use volo_thrift::MaybeException;
pub struct AuthImpl(pub Arc<Application>);

fn server_span(ctx: &Context) -> tracing::Span {
    let fields = PropagationFields {
        traceparent: ctx.trace_parent.to_string(),
        tracestate: ctx.trace_state.as_ref().map(ToString::to_string),
        request_id: ctx.request_id.to_string(),
    };
    let (parent, _) = telemetry::extract(&fields, IngressTrust::Internal);
    let span = tracing::info_span!(target: "telemetry", "auth.rpc.server", otel.kind = "server");
    let _ = span.set_parent(parent);
    span
}
fn rejected(value: Rejection) -> AuthRejected {
    let mut rejection = AuthRejected {
        code: AuthRejectionCode::INVALID_REQUEST,
        retry_after_seconds: None,
        field_errors: None,
        resource_id: None,
    };
    rejection.code = match value {
        Rejection::Unauthenticated => AuthRejectionCode::UNAUTHENTICATED,
        Rejection::ReauthRequired => AuthRejectionCode::REAUTH_REQUIRED,
        Rejection::AuthenticationFailed => AuthRejectionCode::AUTHENTICATION_FAILED,
        Rejection::CeremonyInvalid => AuthRejectionCode::CEREMONY_INVALID,
        Rejection::NoPasskey => AuthRejectionCode::NO_PASSKEY,
        Rejection::PasskeyExists => AuthRejectionCode::PASSKEY_EXISTS,
        Rejection::InvalidRequest(fields) => {
            if !fields.is_empty() {
                rejection.field_errors = Some(
                    fields
                        .into_iter()
                        .map(|field| FieldViolation {
                            path: field.path.into_iter().map(Into::into).collect(),
                            code: match field.code {
                                service_errors::ValidationCode::Required => {
                                    ValidationCode::REQUIRED
                                }
                                service_errors::ValidationCode::InvalidFormat => {
                                    ValidationCode::INVALID_FORMAT
                                }
                                service_errors::ValidationCode::TooLong => ValidationCode::TOO_LONG,
                                service_errors::ValidationCode::OutOfRange => {
                                    ValidationCode::OUT_OF_RANGE
                                }
                            },
                            min: field.min,
                            max: field.max,
                        })
                        .collect(),
                );
            }
            AuthRejectionCode::INVALID_REQUEST
        }
        Rejection::NotFound(id) => {
            rejection.resource_id = Some(id.into());
            AuthRejectionCode::NOT_FOUND
        }
        Rejection::RateLimited => {
            rejection.retry_after_seconds = Some(60);
            AuthRejectionCode::RATE_LIMITED
        }
    };
    rejection
}
fn fault(value: service_errors::Fault) -> ServiceFault {
    telemetry::record_fault(&value);
    ServiceFault {
        code: match value.kind {
            service_errors::FaultKind::Pool | service_errors::FaultKind::Network => {
                ServiceFaultCode::UNAVAILABLE
            }
            service_errors::FaultKind::Timeout => ServiceFaultCode::DEADLINE_EXCEEDED,
            _ => ServiceFaultCode::INTERNAL,
        },
        request_id: telemetry::current_correlation()
            .unwrap_or_default()
            .request_id
            .into(),
    }
}
macro_rules! response {
    ($self:ident, $span:expr, $method:literal, $exception:ident, $work:expr, $convert:expr) => {{
        let span = $span;
        let mut completion = RpcCompletion::new(span.clone(), $method);
        async {
            Ok(match $self.0.run($work).await {
                Ok(value) => {
                    completion.finish("success", None);
                    MaybeException::Ok(($convert)(value))
                }
                Err(Error::Rejected(value)) => {
                    completion.finish("rejected", None);
                    MaybeException::Exception($exception::Rejected(rejected(value)))
                }
                Err(Error::Fault(value)) => {
                    completion.finish("fault", Some(value.public_code().as_str()));
                    MaybeException::Exception($exception::Fault(fault(value)))
                }
            })
        }
        .instrument(span)
        .await
    }};
}

impl AuthService for AuthImpl {
    async fn ready(&self) -> Result<bool, volo_thrift::ServerError> {
        let span = tracing::info_span!(target: "telemetry", "auth.ready", otel.kind = "server");
        Ok(self.0.ready().instrument(span).await)
    }
    async fn login_password(
        &self,
        ctx: Context,
        username: volo::FastStr,
        password: volo::FastStr,
    ) -> Result<
        MaybeException<LoginResult, AuthServiceLoginPasswordException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "LoginPassword",
            AuthServiceLoginPasswordException,
            move |app, db| app.login_password(db, &ctx, username.as_str(), password.as_str()),
            Into::into
        )
    }
    async fn check(
        &self,
        ctx: Context,
    ) -> Result<MaybeException<Session, AuthServiceCheckException>, volo_thrift::ServerError> {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "Check",
            AuthServiceCheckException,
            move |app, db| app.check(db, &ctx),
            Into::into
        )
    }
    async fn logout(
        &self,
        ctx: Context,
    ) -> Result<MaybeException<(), AuthServiceLogoutException>, volo_thrift::ServerError> {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "Logout",
            AuthServiceLogoutException,
            move |app, db| app.logout(db, &ctx),
            |value| value
        )
    }
    async fn reauth_password(
        &self,
        ctx: Context,
        password: volo::FastStr,
    ) -> Result<MaybeException<Session, AuthServiceReauthPasswordException>, volo_thrift::ServerError>
    {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "ReauthPassword",
            AuthServiceReauthPasswordException,
            move |app, db| app.reauth_password(db, &ctx, password.as_str()),
            Into::into
        )
    }
    async fn begin_login(
        &self,
        ctx: CeremonyContext,
    ) -> Result<MaybeException<Options, AuthServiceBeginLoginException>, volo_thrift::ServerError>
    {
        let span = server_span(&ctx.context);
        let ctx: domain::CeremonyContext = ctx.into();
        response!(
            self,
            span,
            "BeginLogin",
            AuthServiceBeginLoginException,
            move |app, db| app.begin(db, &ctx, Purpose::Login, None),
            Into::into
        )
    }
    async fn finish_login(
        &self,
        ctx: CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<
        MaybeException<LoginResult, AuthServiceFinishLoginException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx.context);
        let ctx: domain::CeremonyContext = ctx.into();
        response!(
            self,
            span,
            "FinishLogin",
            AuthServiceFinishLoginException,
            move |app, db| app.finish_login(db, &ctx, credential_json.as_str()),
            Into::into
        )
    }
    async fn begin_reauth(
        &self,
        ctx: CeremonyContext,
    ) -> Result<MaybeException<Options, AuthServiceBeginReauthException>, volo_thrift::ServerError>
    {
        let span = server_span(&ctx.context);
        let ctx: domain::CeremonyContext = ctx.into();
        response!(
            self,
            span,
            "BeginReauth",
            AuthServiceBeginReauthException,
            move |app, db| app.begin(db, &ctx, Purpose::Reauth, None),
            Into::into
        )
    }
    async fn finish_reauth(
        &self,
        ctx: CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<MaybeException<Session, AuthServiceFinishReauthException>, volo_thrift::ServerError>
    {
        let span = server_span(&ctx.context);
        let ctx: domain::CeremonyContext = ctx.into();
        response!(
            self,
            span,
            "FinishReauth",
            AuthServiceFinishReauthException,
            move |app, db| app.finish_reauth(db, &ctx, credential_json.as_str()),
            Into::into
        )
    }
    async fn list_passkeys(
        &self,
        ctx: Context,
    ) -> Result<
        MaybeException<Vec<PasskeyInfo>, AuthServiceListPasskeysException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "ListPasskeys",
            AuthServiceListPasskeysException,
            move |app, db| app.list_passkeys(db, &ctx),
            |value: Vec<domain::PasskeyInfo>| value.into_iter().map(Into::into).collect()
        )
    }
    async fn begin_registration(
        &self,
        ctx: CeremonyContext,
        name: volo::FastStr,
    ) -> Result<
        MaybeException<Options, AuthServiceBeginRegistrationException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx.context);
        let ctx: domain::CeremonyContext = ctx.into();
        response!(
            self,
            span,
            "BeginRegistration",
            AuthServiceBeginRegistrationException,
            move |app, db| app.begin(db, &ctx, Purpose::Register, Some(name.as_str())),
            Into::into
        )
    }
    async fn finish_registration(
        &self,
        ctx: CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<
        MaybeException<PasskeyInfo, AuthServiceFinishRegistrationException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx.context);
        let ctx: domain::CeremonyContext = ctx.into();
        response!(
            self,
            span,
            "FinishRegistration",
            AuthServiceFinishRegistrationException,
            move |app, db| app.finish_registration(db, &ctx, credential_json.as_str()),
            Into::into
        )
    }
    async fn rename_passkey(
        &self,
        ctx: Context,
        id: volo::FastStr,
        name: volo::FastStr,
    ) -> Result<
        MaybeException<PasskeyInfo, AuthServiceRenamePasskeyException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "RenamePasskey",
            AuthServiceRenamePasskeyException,
            move |app, db| app.rename_passkey(db, &ctx, id.as_str(), name.as_str()),
            Into::into
        )
    }
    async fn delete_passkey(
        &self,
        ctx: Context,
        id: volo::FastStr,
    ) -> Result<
        MaybeException<DeletePasskeyResult, AuthServiceDeletePasskeyException>,
        volo_thrift::ServerError,
    > {
        let span = server_span(&ctx);
        let ctx: domain::Context = ctx.into();
        response!(
            self,
            span,
            "DeletePasskey",
            AuthServiceDeletePasskeyException,
            move |app, db| app.delete_passkey(db, &ctx, id.as_str()),
            Into::into
        )
    }
}

impl From<Context> for domain::Context {
    fn from(value: Context) -> Self {
        Self {
            session_token: value.session_token.map(|v| v.to_string()),
        }
    }
}
impl From<CeremonyContext> for domain::CeremonyContext {
    fn from(value: CeremonyContext) -> Self {
        Self {
            context: value.context.into(),
            browser_binding: value.browser_binding.to_string(),
            ceremony_id: value.ceremony_id.map(|v| v.to_string()),
        }
    }
}
impl From<domain::Session> for Session {
    fn from(value: domain::Session) -> Self {
        Self {
            user_id: value.user_id.into(),
            username: value.username.into(),
            idle_expires_at: value.idle_expires_at,
            absolute_expires_at: value.absolute_expires_at,
            recent_authentication_until: value.recent_authentication_until,
        }
    }
}
impl From<domain::LoginResult> for LoginResult {
    fn from(value: domain::LoginResult) -> Self {
        Self {
            session_token: value.session_token.into(),
            session: value.session.into(),
        }
    }
}
impl From<domain::Options> for Options {
    fn from(value: domain::Options) -> Self {
        Self {
            ceremony_id: value.ceremony_id.into(),
            public_key_json: value.public_key_json.into(),
        }
    }
}
impl From<domain::PasskeyInfo> for PasskeyInfo {
    fn from(value: domain::PasskeyInfo) -> Self {
        Self {
            id: value.id.into(),
            name: value.name.into(),
            created_at: value.created_at,
            last_used_at: value.last_used_at,
        }
    }
}
impl From<domain::DeletePasskeyResult> for DeletePasskeyResult {
    fn from(value: domain::DeletePasskeyResult) -> Self {
        Self {
            id: value.id.into(),
            session_invalidated: value.session_invalidated,
        }
    }
}
