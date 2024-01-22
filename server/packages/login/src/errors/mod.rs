/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:03:27
 * @FilePath: /self-tools/server/packages/login/src/errors/mod.rs
 */
use axum::{
    extract::rejection::{ExtensionRejection, JsonRejection},
    Json,
};
use axum::{
    http::header::InvalidHeaderValue,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use serde_json::json;
use std::convert::From;
use thiserror::Error;
use thrift::auth::{AuthError, ItemServiceLoginException};
use tracing::{event, Level};

use self::response::OpenErrorResponse;

pub mod response;
#[derive(Error, Debug, Serialize)]
pub enum OpenError {
    #[error("未知错误")]
    UnknownError,
    #[error("json 解析错误：{}",.0)]
    JsonError(String),
    #[error("extension 解析错误:{}",.0)]
    ExtensionError(String),
    #[error("jwt 解析错误")]
    Jwt,
    #[error("密码错误")]
    PasswordError,
    #[error("登陆过期")]
    AuthTimeout,
    #[error("token 错误")]
    TokenError,
    #[error("密码未设置")]
    PasswordNotSet,
    #[error("secret key未设置")]
    SecretKeyNotSet,
    #[error("username未设置")]
    UsernameNotSet,
    #[error("thrift client 错误:{}",.0)]
    ClientError(#[from] &'static thrift::ClientError),
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

impl From<ExtensionRejection> for OpenError {
    fn from(value: ExtensionRejection) -> Self {
        Self::ExtensionError(value.to_string())
    }
}

impl From<volo_thrift::error::ResponseError<ItemServiceLoginException>> for OpenError {
    fn from(value: volo_thrift::error::ResponseError<ItemServiceLoginException>) -> Self {
        match value {
            volo_thrift::ResponseError::UserException(ItemServiceLoginException::Err(
                AuthError { code },
            )) => match code {
                thrift::auth::AuthErrorCode::Jwt => Self::Jwt,
                thrift::auth::AuthErrorCode::PasswordError => Self::PasswordError,
                thrift::auth::AuthErrorCode::AuthTimeout => Self::AuthTimeout,
                thrift::auth::AuthErrorCode::TokenError => Self::TokenError,
                thrift::auth::AuthErrorCode::PasswordNotSet => Self::PasswordNotSet,
                thrift::auth::AuthErrorCode::SecretKeyNotSet => Self::SecretKeyNotSet,
                thrift::auth::AuthErrorCode::UsernameNotSet => Self::UsernameNotSet,
            },
            _ => Self::UnknownError,
        }
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
