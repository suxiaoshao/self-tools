use axum::{
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

use super::OpenError;

#[derive(Serialize)]
pub(super) struct OpenErrorResponse {
    code: OpenError,
    message: String,
}

impl From<OpenError> for OpenErrorResponse {
    fn from(error: OpenError) -> Self {
        OpenErrorResponse {
            message: format!("{}", error),
            code: error,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub(crate) struct OpenResponse<T: Serialize> {
    pub(crate) data: T,
}

impl<T: Serialize> IntoResponse for OpenResponse<T> {
    fn into_response(self) -> Response {
        match serde_json::to_value(self) {
            Ok(e) => Json(e),
            Err(_) => Json(json!({
                "code":"UnknownError",
                "message":"未知错误"
            })),
        }
        .into_response()
    }
}
