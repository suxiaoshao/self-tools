use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thrift::auth::*;
#[derive(Debug)]
pub struct ApiError(pub StatusCode, pub &'static str, pub Option<i32>);
impl ApiError {
    pub fn invalid() -> Self {
        Self(StatusCode::BAD_REQUEST, "INVALID_REQUEST", None)
    }
    pub fn rejected() -> Self {
        Self(StatusCode::FORBIDDEN, "REQUEST_REJECTED", None)
    }
    pub fn unavailable() -> Self {
        Self(StatusCode::SERVICE_UNAVAILABLE, "AUTH_UNAVAILABLE", None)
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = (
            self.0,
            Json(serde_json::json!({"code":self.1,"message":self.1})),
        )
            .into_response();
        response
            .headers_mut()
            .insert("cache-control", "no-store".parse().unwrap());
        if let Some(seconds) = self.2 {
            response
                .headers_mut()
                .insert("retry-after", seconds.to_string().parse().unwrap());
        }
        response
    }
}
impl From<AuthFailure> for ApiError {
    fn from(value: AuthFailure) -> Self {
        let (status, code) = match value.code {
            FailureCode::UNAUTHENTICATED => (401, "UNAUTHENTICATED"),
            FailureCode::REAUTH_REQUIRED => (403, "REAUTH_REQUIRED"),
            FailureCode::AUTHENTICATION_FAILED => (401, "AUTHENTICATION_FAILED"),
            FailureCode::CEREMONY_INVALID => (400, "CEREMONY_INVALID"),
            FailureCode::NO_PASSKEY => (409, "NO_PASSKEY"),
            FailureCode::PASSKEY_EXISTS => (409, "PASSKEY_EXISTS"),
            FailureCode::INVALID_REQUEST => (400, "INVALID_REQUEST"),
            FailureCode::NOT_FOUND => (404, "NOT_FOUND"),
            FailureCode::RATE_LIMITED => (429, "RATE_LIMITED"),
            _ => (503, "AUTH_UNAVAILABLE"),
        };
        Self(
            StatusCode::from_u16(status).unwrap(),
            code,
            value.retry_after_seconds,
        )
    }
}
impl From<volo_thrift::ClientError> for ApiError {
    fn from(_: volo_thrift::ClientError) -> Self {
        Self::unavailable()
    }
}
impl From<thrift::ClientError> for ApiError {
    fn from(_: thrift::ClientError) -> Self {
        Self::unavailable()
    }
}
impl From<AuthServiceLoginPasswordException> for ApiError {
    fn from(AuthServiceLoginPasswordException::Err(e): AuthServiceLoginPasswordException) -> Self {
        e.into()
    }
}
impl From<AuthServiceCheckException> for ApiError {
    fn from(AuthServiceCheckException::Err(e): AuthServiceCheckException) -> Self {
        e.into()
    }
}
impl From<AuthServiceLogoutException> for ApiError {
    fn from(AuthServiceLogoutException::Err(e): AuthServiceLogoutException) -> Self {
        e.into()
    }
}
impl From<AuthServiceReauthPasswordException> for ApiError {
    fn from(
        AuthServiceReauthPasswordException::Err(e): AuthServiceReauthPasswordException,
    ) -> Self {
        e.into()
    }
}
impl From<AuthServiceBeginLoginException> for ApiError {
    fn from(AuthServiceBeginLoginException::Err(e): AuthServiceBeginLoginException) -> Self {
        e.into()
    }
}
impl From<AuthServiceFinishLoginException> for ApiError {
    fn from(AuthServiceFinishLoginException::Err(e): AuthServiceFinishLoginException) -> Self {
        e.into()
    }
}
impl From<AuthServiceBeginReauthException> for ApiError {
    fn from(AuthServiceBeginReauthException::Err(e): AuthServiceBeginReauthException) -> Self {
        e.into()
    }
}
impl From<AuthServiceFinishReauthException> for ApiError {
    fn from(AuthServiceFinishReauthException::Err(e): AuthServiceFinishReauthException) -> Self {
        e.into()
    }
}
impl From<AuthServiceListPasskeysException> for ApiError {
    fn from(AuthServiceListPasskeysException::Err(e): AuthServiceListPasskeysException) -> Self {
        e.into()
    }
}
impl From<AuthServiceBeginRegistrationException> for ApiError {
    fn from(
        AuthServiceBeginRegistrationException::Err(e): AuthServiceBeginRegistrationException,
    ) -> Self {
        e.into()
    }
}
impl From<AuthServiceFinishRegistrationException> for ApiError {
    fn from(
        AuthServiceFinishRegistrationException::Err(e): AuthServiceFinishRegistrationException,
    ) -> Self {
        e.into()
    }
}
impl From<AuthServiceRenamePasskeyException> for ApiError {
    fn from(AuthServiceRenamePasskeyException::Err(e): AuthServiceRenamePasskeyException) -> Self {
        e.into()
    }
}
impl From<AuthServiceDeletePasskeyException> for ApiError {
    fn from(AuthServiceDeletePasskeyException::Err(e): AuthServiceDeletePasskeyException) -> Self {
        e.into()
    }
}
