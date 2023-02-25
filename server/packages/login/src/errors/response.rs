use std::fmt::Debug;

use axum::{
    response::{IntoResponse, Response},
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::{event, Level};

use super::OpenError;

#[derive(Serialize, Debug)]
pub(super) struct OpenErrorResponse {
    code: OpenError,
    message: String,
}

impl From<OpenError> for OpenErrorResponse {
    fn from(error: OpenError) -> Self {
        OpenErrorResponse {
            message: format!("{error}"),
            code: error,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub(crate) struct OpenResponse<T: Serialize + Debug> {
    pub(crate) data: T,
}

impl<T: Serialize + Debug> OpenResponse<T> {
    pub fn new(data: T) -> Self {
        OpenResponse { data }
    }
}

impl<T: Serialize + Debug> IntoResponse for OpenResponse<T> {
    fn into_response(self) -> Response {
        match serde_json::to_value(&self) {
            Ok(e) => Json(e),
            Err(_) => {
                event!(Level::ERROR, "json 解析错误: {:?}", self);
                Json(json!({
                    "code":"UnknownError",
                    "message":"未知错误"
                }))
            }
        }
        .into_response()
    }
}
