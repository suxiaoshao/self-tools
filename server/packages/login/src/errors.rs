/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-14 11:34:42
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
use webauthn_rs::prelude::WebauthnError;

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
    ClientError(String),
    #[error("webauthn 错误:{}",.0)]
    WebauthnError(String),
    #[error("url parse:{}",.0)]
    UrlParseError(&'static str),
    #[error("Session 错误:{}",.0)]
    SessionError(String),
    #[error("webauthn 用户不存在")]
    WebauthnUserNotExist,
    #[error("用户没有凭证")]
    UserHasNoCredentials,
    #[error("webauthn auth 没设置")]
    WebauthnAuthNotSet,
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

impl From<volo_thrift::error::ClientError> for OpenError {
    fn from(_: volo_thrift::error::ClientError) -> Self {
        Self::UnknownError
    }
}

impl From<thrift::ClientError> for OpenError {
    fn from(value: thrift::ClientError) -> Self {
        Self::ClientError(value.to_string())
    }
}

impl From<ItemServiceLoginException> for OpenError {
    fn from(ItemServiceLoginException::Err(AuthError { code }): ItemServiceLoginException) -> Self {
        match code {
            thrift::auth::AuthErrorCode::JWT => Self::Jwt,
            thrift::auth::AuthErrorCode::PASSWORD_ERROR => Self::PasswordError,
            thrift::auth::AuthErrorCode::AUTH_TIMEOUT => Self::AuthTimeout,
            thrift::auth::AuthErrorCode::TOKEN_ERROR => Self::TokenError,
            thrift::auth::AuthErrorCode::PASSWORD_NOT_SET => Self::PasswordNotSet,
            thrift::auth::AuthErrorCode::SECRET_KEY_NOT_SET => Self::SecretKeyNotSet,
            thrift::auth::AuthErrorCode::USERNAME_NOT_SET => Self::UsernameNotSet,
            _ => Self::UnknownError,
        }
    }
}

impl From<WebauthnError> for OpenError {
    fn from(value: WebauthnError) -> Self {
        Self::WebauthnError(value.to_string())
    }
}

impl From<tower_sessions::session::Error> for OpenError {
    fn from(value: tower_sessions::session::Error) -> Self {
        Self::SessionError(value.to_string())
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
