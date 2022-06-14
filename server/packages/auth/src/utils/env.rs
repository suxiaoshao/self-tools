use std::env;

use errors::{TonicError, TonicResult};

pub fn env_password() -> TonicResult<String> {
    env::var("PASSWORD").map_err(|_| TonicError::PasswordNotSet)
}

pub fn env_secret_key() -> TonicResult<String> {
    env::var("SECRET").map_err(|_| TonicError::SecretKeyNotSet)
}
pub fn env_username() -> TonicResult<String> {
    env::var("USERNAME").map_err(|_| TonicError::UsernameNotSet)
}
