use async_graphql::{ErrorExtensionValues, ErrorExtensions};
use diesel::r2d2;
use std::sync::Arc;
use tonic::{transport, Code, Status};

#[derive(Debug)]
pub enum GraphqlError {
    Status(Status),
    Transport,
    ParseFolderName,
    R2d2(String),
    Diesel(String),
}

impl GraphqlError {
    pub fn message(&self) -> String {
        match self {
            GraphqlError::Status(status) => status.message().to_string(),
            GraphqlError::Transport => "内部连接错误".to_string(),
            GraphqlError::ParseFolderName => "目录获取错误".to_string(),
            GraphqlError::R2d2(_) => "数据库连接错误".to_string(),
            GraphqlError::Diesel(data) => format!("数据库错误:{}", data),
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
            GraphqlError::ParseFolderName => GraphqlError::ParseFolderName,
            GraphqlError::R2d2(data) => Self::R2d2(data.clone()),
            GraphqlError::Diesel(data) => Self::Diesel(data.clone()),
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

impl ErrorExtensions for GraphqlError {
    fn extend(&self) -> async_graphql::Error {
        let mut extensions = ErrorExtensionValues::default();
        extensions.set("source", format!("{self:#?}"));

        match self {
            GraphqlError::Status(status) => {
                let code = match status.code() {
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
                };
                extensions.set("code", code);
            }
            GraphqlError::Transport => extensions.set("code", "Transport"),
            GraphqlError::ParseFolderName => extensions.set("code", "Internal"),
            GraphqlError::R2d2(_) => extensions.set("code", "R2d2"),
            GraphqlError::Diesel(_) => extensions.set("code", "Diesel"),
        };
        async_graphql::Error {
            message: self.message(),
            source: Some(Arc::new(self.clone())),
            extensions: Some(extensions),
        }
    }
}

impl From<GraphqlError> for async_graphql::Error {
    fn from(value: GraphqlError) -> async_graphql::Error {
        value.extend()
    }
}
