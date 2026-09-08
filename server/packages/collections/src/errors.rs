use async_graphql::ErrorExtensionValues;
use axum::{Json, response::IntoResponse};
use diesel::r2d2;
use std::{env::VarError, sync::Arc};

#[derive(Debug)]
pub(crate) enum GraphqlError {
    /// 数据库连接池
    R2d2(String),
    /// 数据库操作错误
    Diesel(String),
    /// 没有认证
    Unauthenticated,
    /// 资源不存在
    NotFound(&'static str, i64),
    /// 资源不存在
    NotFoundMany(&'static str, Vec<i64>),
    /// 已存在
    AlreadyExists(String),
    PageSizeTooMore,
    /// thrift 错误
    Thrift(String),
    ClientError(String),
    VarError(VarError),
    NotGraphqlContextData(&'static str),
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
    pub(crate) fn message(&self) -> String {
        match self {
            GraphqlError::R2d2(_) => "数据库连接错误".to_string(),
            GraphqlError::Diesel(data) => format!("数据库错误:{data}"),
            GraphqlError::Unauthenticated => "未登录".to_string(),
            GraphqlError::NotFound(tag, id) => format!(r#"{tag}"{id}"不存在"#),
            GraphqlError::AlreadyExists(name) => format!("{name}已存在"),
            GraphqlError::PageSizeTooMore => "页码太大".to_string(),
            GraphqlError::Thrift(data) => format!("thrift 错误:{data}"),
            GraphqlError::ClientError(data) => format!("thrift client错误:{data}"),
            GraphqlError::VarError(err) => format!("env error:{err}"),
            GraphqlError::NotGraphqlContextData(tag) => format!("graphql context data:{tag}不存在"),
            GraphqlError::NotFoundMany(tag, items) => {
                format!(r#"{tag}"{:?}"不存在"#, items)
            }
        }
    }
    pub(crate) fn code(&self) -> &str {
        match self {
            GraphqlError::R2d2(_) => "FailedPrecondition",
            GraphqlError::Diesel(_) => "Internal",
            GraphqlError::Unauthenticated => "Unauthenticated",
            GraphqlError::NotFound(..) | GraphqlError::AlreadyExists(_) => "InvalidArgument",
            GraphqlError::PageSizeTooMore => "InvalidArgument",
            GraphqlError::Thrift(_) => "Thrift",
            GraphqlError::ClientError(_) => "ThriftClient",
            GraphqlError::VarError(_) => "VarError",
            GraphqlError::NotGraphqlContextData(_) => "NotGraphqlContextData",
            GraphqlError::NotFoundMany(_, _) => "NotFoundMany",
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
            GraphqlError::PageSizeTooMore => Self::PageSizeTooMore,
            GraphqlError::Thrift(data) => Self::Thrift(data.clone()),
            GraphqlError::ClientError(data) => Self::ClientError(data.clone()),
            GraphqlError::VarError(data) => Self::VarError(data.clone()),
            GraphqlError::NotGraphqlContextData(data) => Self::NotGraphqlContextData(data),
            GraphqlError::NotFoundMany(tag, data) => Self::NotFoundMany(tag, data.clone()),
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

impl From<thrift::ClientError> for GraphqlError {
    fn from(value: thrift::ClientError) -> Self {
        Self::ClientError(value.to_string())
    }
}

pub(crate) type GraphqlResult<T> = Result<T, GraphqlError>;

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

impl From<VarError> for GraphqlError {
    fn from(value: VarError) -> Self {
        Self::VarError(value)
    }
}
