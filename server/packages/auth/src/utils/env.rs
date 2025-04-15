/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-18 01:35:07
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-14 10:07:39
 * @FilePath: /self-tools/server/packages/new_auth/src/utils/env.rs
 */
use std::env;

use thrift::auth::AuthErrorCode;

pub fn env_password() -> Result<String, AuthErrorCode> {
    env::var("PASSWORD").map_err(|_| AuthErrorCode::PASSWORD_NOT_SET)
}

pub fn env_secret_key() -> Result<String, AuthErrorCode> {
    env::var("SECRET").map_err(|_| AuthErrorCode::SECRET_KEY_NOT_SET)
}
pub fn env_username() -> Result<String, AuthErrorCode> {
    env::var("USERNAME").map_err(|_| AuthErrorCode::USERNAME_NOT_SET)
}
