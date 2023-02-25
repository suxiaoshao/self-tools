use axum::{extract::rejection::JsonRejection, Json};
use axum::{
    http::header::InvalidHeaderValue,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use serde_json::json;
use std::convert::From;
use thiserror::Error;
use tracing::{event, Level};

use self::response::OpenErrorResponse;
use self::status::OpenStatus;

pub mod response;
mod status;
#[derive(Error, Debug, Serialize)]
pub enum OpenError {
    #[error("内部连接错误")]
    TransportError,
    #[error("{}",.0.message)]
    Status(OpenStatus),
    #[error("未知错误")]
    UnknownError,
    #[error("json 解析错误：{}",.0)]
    JsonError(String),
}

impl From<tonic::transport::Error> for OpenError {
    fn from(_: tonic::transport::Error) -> Self {
        OpenError::TransportError
    }
}

impl From<tonic::Status> for OpenError {
    fn from(value: tonic::Status) -> Self {
        Self::Status(value.into())
    }
}

impl From<InvalidHeaderValue> for OpenError {
    fn from(_value: InvalidHeaderValue) -> Self {
        Self::UnknownError
    }
}

impl From<JsonRejection> for OpenError {
    fn from(value: JsonRejection) -> Self {
        Self::JsonError(value.to_string())
    }
}

pub type OpenResult<T> = Result<T, OpenError>;

impl IntoResponse for OpenError {
    fn into_response(self) -> Response {
        let error_response = OpenErrorResponse::from(self);
        match serde_json::to_value(&error_response) {
            Ok(e) => Json(e),
            Err(_) => {
                event!(Level::ERROR, "json 解析错误: {:?}", error_response);
                Json(json!({
                    "code":"UnknownError",
                    "message":"未知错误"
                }))
            }
        }
        .into_response()
    }
}
