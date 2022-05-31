use std::env::VarError;

use thiserror::Error;
use tonic::Status;

pub type TonicResult<T> = Result<T, TonicError>;

#[derive(Error, Debug)]
pub enum TonicError {
    #[error("{}",.0.message())]
    Status(#[source] Status),
    #[error("管理员配置缺失")]
    NoneConfiguration(#[source] VarError),
    #[error("内部连接错误:{}",.0)]
    Transport(#[source] tonic::transport::Error),
    #[cfg(feature = "jsonwebtoken")]
    #[error("jwt 错误:{}",.0)]
    Jwt(#[source] jsonwebtoken::errors::Error),
    #[error("账号密码错误")]
    PasswordError,
    #[error("身份已超时")]
    AuthTimeout,
    #[error("身份令牌错误")]
    TokenError,
}

impl From<VarError> for TonicError {
    fn from(value: VarError) -> Self {
        Self::NoneConfiguration(value)
    }
}

#[cfg(feature = "jsonwebtoken")]
impl From<jsonwebtoken::errors::Error> for TonicError {
    fn from(value: jsonwebtoken::errors::Error) -> Self {
        Self::Jwt(value)
    }
}

impl From<TonicError> for Status {
    fn from(error: TonicError) -> Self {
        let message = error.to_string();
        match error {
            TonicError::Status(e) => e,

            TonicError::NoneConfiguration(_) | TonicError::Transport(_) => {
                Status::failed_precondition(message)
            }

            TonicError::PasswordError | TonicError::AuthTimeout | TonicError::TokenError => {
                Status::unauthenticated(message)
            }
            #[cfg(feature = "jsonwebtoken")]
            TonicError::Jwt(_) => Status::unauthenticated(message),
        }
    }
}
