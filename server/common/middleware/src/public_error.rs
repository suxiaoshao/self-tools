use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use service_errors::{Fault, FieldViolation, PublicCode, PublicError};

#[derive(Debug)]
pub struct HttpError(pub PublicError);
impl HttpError {
    pub fn new(code: PublicCode) -> Self {
        Self(PublicError::new(
            code,
            telemetry::current_correlation()
                .unwrap_or_default()
                .request_id,
        ))
    }
    pub fn invalid(fields: Vec<FieldViolation>) -> Self {
        let mut error = Self::new(PublicCode::InvalidRequest);
        if !fields.is_empty() {
            error.0.field_errors = Some(fields);
        }
        error
    }
}
impl From<Fault> for HttpError {
    fn from(fault: Fault) -> Self {
        telemetry::record_fault(&fault);
        Self::new(fault.public_code())
    }
}
impl IntoResponse for HttpError {
    fn into_response(self) -> Response {
        let status = StatusCode::from_u16(self.0.code.status()).expect("public statuses are valid");
        let request_id = self.0.request_id.clone();
        let retry_after = self.0.retry_after_seconds;
        let mut response = (status, Json(serde_json::json!({ "error": self.0 }))).into_response();
        response
            .headers_mut()
            .insert("cache-control", "no-store".parse().unwrap());
        if let Ok(value) = request_id.parse() {
            response.headers_mut().insert("x-request-id", value);
        }
        if let Some(seconds) = retry_after {
            response
                .headers_mut()
                .insert("retry-after", seconds.to_string().parse().unwrap());
        }
        response
    }
}

#[cfg(feature = "graphql-trace")]
impl From<async_graphql::ParseRequestError> for HttpError {
    fn from(_: async_graphql::ParseRequestError) -> Self {
        Self::new(PublicCode::InvalidRequest)
    }
}
