use async_graphql::ErrorExtensionValues;
use axum::{response::IntoResponse, Json};
use diesel::r2d2;
use std::sync::Arc;
use thrift::auth::ItemServiceCheckException;

#[derive(Debug)]
pub enum GraphqlError {
    /// 数据库连接池
    R2d2(String),
    /// 数据库操作错误
    Diesel(String),
    /// 没有认证
    Unauthenticated,
    /// 资源不存在
    NotFound(&'static str, i64),
    /// 已存在
    AlreadyExists(String),
    /// scope 错误
    Scope {
        sub_tag: &'static str,
        super_tag: &'static str,
        sub_value: i64,
        super_value: Option<i64>,
    },
    PageSizeTooMore,
    Jwt,
    PasswordError,
    AuthTimeout,
    TokenError,
    PasswordNotSet,
    SecretKeyNotSet,
    UsernameNotSet,
    /// thrift 错误
    Thrift(String),
    ClientError(&'static thrift::ClientError),
}

impl IntoResponse for GraphqlError {
    fn into_response(self) -> axum::response::Response {
        Json(serde_json::json!({
            "data": null,
            "errors":[{
                "message": self.message(),
                "extensions": {
                    "code": self.code(),
                    "source":format!("{self:#?}")
                }
            }]
        }))
        .into_response()
    }
}

impl GraphqlError {
    pub fn message(&self) -> String {
        match self {
            GraphqlError::R2d2(_) => "数据库连接错误".to_string(),
            GraphqlError::Diesel(data) => format!("数据库错误:{data}"),
            GraphqlError::Unauthenticated => "没有发送 token".to_string(),
            GraphqlError::NotFound(tag, id) => format!(r#"{tag}"{id}"不存在"#),
            GraphqlError::AlreadyExists(name) => format!("{name}已存在"),
            GraphqlError::Scope {
                super_tag,
                sub_tag,
                sub_value,
                super_value,
            } => format!(
                r#"{}"{}"不属于{}"{}""#,
                sub_tag,
                sub_value,
                super_tag,
                match super_value {
                    Some(super_value) => super_value.to_string(),
                    None => "无".to_string(),
                }
            ),
            GraphqlError::PageSizeTooMore => "页码太大".to_string(),
            GraphqlError::Jwt => "jwt 解析错误".to_string(),
            GraphqlError::PasswordError => "密码错误".to_string(),
            GraphqlError::AuthTimeout => "登陆过期".to_string(),
            GraphqlError::TokenError => "token 错误".to_string(),
            GraphqlError::PasswordNotSet => "密码未设置".to_string(),
            GraphqlError::SecretKeyNotSet => "select key未设置".to_string(),
            GraphqlError::UsernameNotSet => "username未设置".to_string(),
            GraphqlError::Thrift(data) => format!("thrift 错误:{data}"),
            GraphqlError::ClientError(data) => format!("thrift client错误:{data}"),
        }
    }
    pub fn code(&self) -> &str {
        match self {
            GraphqlError::R2d2(_) => "FailedPrecondition",
            GraphqlError::Diesel(_) => "Internal",
            GraphqlError::Unauthenticated => "Unauthenticated",
            GraphqlError::NotFound(..)
            | GraphqlError::AlreadyExists(_)
            | GraphqlError::Scope { .. } => "InvalidArgument",
            GraphqlError::PageSizeTooMore => "InvalidArgument",
            GraphqlError::Jwt => "Jwt",
            GraphqlError::PasswordError => "PasswordError",
            GraphqlError::AuthTimeout => "AuthTimeout",
            GraphqlError::TokenError => "TokenError",
            GraphqlError::PasswordNotSet => "PasswordNotSet",
            GraphqlError::SecretKeyNotSet => "SecretKeyNotSet",
            GraphqlError::UsernameNotSet => "UsernameNotSet",
            GraphqlError::Thrift(_) => "Thrift",
            GraphqlError::ClientError(_) => "ThriftClient",
        }
    }
}

impl Clone for GraphqlError {
    fn clone(&self) -> Self {
        match self {
            GraphqlError::R2d2(data) => Self::R2d2(data.clone()),
            GraphqlError::Diesel(data) => Self::Diesel(data.clone()),
            GraphqlError::Unauthenticated => Self::Unauthenticated,
            GraphqlError::NotFound(tag, id) => Self::NotFound(tag, *id),
            GraphqlError::AlreadyExists(name) => Self::AlreadyExists(name.clone()),
            GraphqlError::Scope {
                sub_tag,
                super_tag,
                sub_value,
                super_value,
            } => Self::Scope {
                sub_tag,
                super_tag,
                sub_value: *sub_value,
                super_value: *super_value,
            },
            GraphqlError::PageSizeTooMore => Self::PageSizeTooMore,
            GraphqlError::Jwt => Self::Jwt,
            GraphqlError::PasswordError => Self::PasswordError,
            GraphqlError::AuthTimeout => Self::AuthTimeout,
            GraphqlError::TokenError => Self::TokenError,
            GraphqlError::PasswordNotSet => Self::PasswordNotSet,
            GraphqlError::SecretKeyNotSet => Self::SecretKeyNotSet,
            GraphqlError::UsernameNotSet => Self::UsernameNotSet,
            GraphqlError::Thrift(data) => Self::Thrift(data.clone()),
            GraphqlError::ClientError(data) => Self::ClientError(data),
        }
    }
}

impl From<r2d2::PoolError> for GraphqlError {
    fn from(error: r2d2::PoolError) -> Self {
        Self::R2d2(error.to_string())
    }
}

impl From<diesel::result::Error> for GraphqlError {
    fn from(error: diesel::result::Error) -> Self {
        Self::Diesel(error.to_string())
    }
}

impl From<volo_thrift::error::ClientError> for GraphqlError {
    fn from(value: volo_thrift::error::ClientError) -> Self {
        match value {
            volo_thrift::ClientError::Application(x) => Self::Thrift(x.to_string()),
            volo_thrift::ClientError::Transport(x) => Self::Thrift(x.to_string()),
            volo_thrift::ClientError::Protocol(x) => Self::Thrift(x.to_string()),
            volo_thrift::ClientError::Biz(x) => Self::Thrift(x.to_string()),
        }
    }
}

impl From<ItemServiceCheckException> for GraphqlError {
    fn from(value: ItemServiceCheckException) -> Self {
        match value {
            ItemServiceCheckException::Err(thrift::auth::AuthError { code }) => match code {
                thrift::auth::AuthErrorCode::JWT => Self::Jwt,
                thrift::auth::AuthErrorCode::PASSWORD_ERROR => Self::PasswordError,
                thrift::auth::AuthErrorCode::AUTH_TIMEOUT => Self::AuthTimeout,
                thrift::auth::AuthErrorCode::TOKEN_ERROR => Self::TokenError,
                thrift::auth::AuthErrorCode::PASSWORD_NOT_SET => Self::PasswordNotSet,
                thrift::auth::AuthErrorCode::SECRET_KEY_NOT_SET => Self::SecretKeyNotSet,
                thrift::auth::AuthErrorCode::USERNAME_NOT_SET => Self::UsernameNotSet,
                _ => Self::Thrift("未知错误".to_string()),
            },
        }
    }
}

impl From<&'static thrift::ClientError> for GraphqlError {
    fn from(value: &'static thrift::ClientError) -> Self {
        Self::ClientError(value)
    }
}

pub type GraphqlResult<T> = Result<T, GraphqlError>;

impl From<GraphqlError> for async_graphql::Error {
    fn from(value: GraphqlError) -> async_graphql::Error {
        let mut extensions = ErrorExtensionValues::default();
        extensions.set("source", format!("{value:#?}"));
        let code = value.code();
        extensions.set("code", code);

        async_graphql::Error {
            message: value.message(),
            source: Some(Arc::new(value)),
            extensions: Some(extensions),
        }
    }
}
