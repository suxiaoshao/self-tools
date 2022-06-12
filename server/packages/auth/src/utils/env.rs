use errors::{TonicError, TonicResult};

pub fn env_password() -> TonicResult<String> {
    dotenv::var("PASSWORD").map_err(|_| TonicError::PasswordNotSet)
}

pub fn env_secret_key() -> TonicResult<String> {
    dotenv::var("SECRET").map_err(|_| TonicError::SecretKeyNotSet)
}
pub fn env_username() -> TonicResult<String> {
    dotenv::var("USERNAME").map_err(|_| TonicError::UsernameNotSet)
}
