use axum::response::{IntoResponse, Response};
use middleware::HttpError;
use service_errors::{Fault, FieldViolation, PublicCode};
#[derive(Debug)]
pub struct ApiError(pub HttpError);
impl ApiError {
    pub fn new(code: PublicCode) -> Self {
        Self(HttpError::new(code))
    }
    pub fn invalid() -> Self {
        Self::new(PublicCode::InvalidRequest)
    }
    pub fn invalid_field(path: &'static str) -> Self {
        Self(HttpError::invalid(vec![FieldViolation::new(
            path,
            service_errors::ValidationCode::Required,
        )]))
    }
    pub fn rejected() -> Self {
        Self::new(PublicCode::RequestRejected)
    }
    pub fn protocol() -> Self {
        Self::new(PublicCode::UpstreamFailure)
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        self.0.into_response()
    }
}
impl From<Fault> for ApiError {
    fn from(value: Fault) -> Self {
        Self(value.into())
    }
}
impl From<thrift::RpcError> for ApiError {
    fn from(value: thrift::RpcError) -> Self {
        Self(HttpError(value.public_error()))
    }
}
