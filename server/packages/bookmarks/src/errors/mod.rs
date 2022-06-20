use async_graphql::ErrorExtensionValues;
use axum::{response::IntoResponse, Json};
use diesel::r2d2;
use std::sync::Arc;
use tonic::{transport, Code, Status};

#[derive(Debug)]
pub enum GraphqlError {
    Status(Status),
    Transport,
    R2d2(String),
    Diesel(String),
    Unauthenticated,
    NotFound(&'static str),
    DirAreadyExists,
    ParseDirName,
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
            GraphqlError::Status(status) => status.message().to_string(),
            GraphqlError::Transport => "内部连接错误".to_string(),
            GraphqlError::R2d2(_) => "数据库连接错误".to_string(),
            GraphqlError::Diesel(data) => format!("数据库错误:{}", data),
            GraphqlError::Unauthenticated => "没有发送 token".to_string(),
            GraphqlError::NotFound(tag) => format!("该{}不存在", tag),
            GraphqlError::DirAreadyExists => "目录已存在".to_string(),
            GraphqlError::ParseDirName => "解析目录名错误".to_string(),
        }
    }
    pub fn code(&self) -> &str {
        match self {
            GraphqlError::Status(status) => match status.code() {
                Code::Ok => "Ok",
                Code::Cancelled => "Cancelled",
                Code::Unknown => "Unknown",
                Code::InvalidArgument => "InvalidArgument",
                Code::DeadlineExceeded => "DeadlineExceeded",
                Code::NotFound => "NotFound",
                Code::AlreadyExists => "AlreadyExists",
                Code::PermissionDenied => "PermissionDenied",
                Code::ResourceExhausted => "ResourceExhausted",
                Code::FailedPrecondition => "FailedPrecondition",
                Code::Aborted => "Aborted",
                Code::OutOfRange => "OutOfRange",
                Code::Unimplemented => "Unimplemented",
                Code::Internal => "Internal",
                Code::Unavailable => "Unavailable",
                Code::DataLoss => "DataLoss",
                Code::Unauthenticated => "Unauthenticated",
            },
            GraphqlError::Transport => "Transport",
            GraphqlError::R2d2(_) => "FailedPrecondition",
            GraphqlError::Diesel(_) | GraphqlError::ParseDirName => "Internal",
            GraphqlError::Unauthenticated => "Unauthenticated",
            GraphqlError::NotFound(_) | GraphqlError::DirAreadyExists => "InvalidArgument",
        }
    }
}

impl Clone for GraphqlError {
    fn clone(&self) -> Self {
        match self {
            GraphqlError::Status(status) => {
                Self::Status(Status::new(status.code(), status.message()))
            }
            GraphqlError::Transport => Self::Transport,
            GraphqlError::R2d2(data) => Self::R2d2(data.clone()),
            GraphqlError::Diesel(data) => Self::Diesel(data.clone()),
            GraphqlError::Unauthenticated => Self::Unauthenticated,
            GraphqlError::NotFound(tag) => Self::NotFound(tag),
            GraphqlError::DirAreadyExists => Self::DirAreadyExists,
            GraphqlError::ParseDirName => Self::ParseDirName,
        }
    }
}

impl From<transport::Error> for GraphqlError {
    fn from(_: transport::Error) -> Self {
        Self::Transport
    }
}

impl From<Status> for GraphqlError {
    fn from(error: Status) -> Self {
        Self::Status(error)
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
