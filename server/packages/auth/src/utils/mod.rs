/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-18 01:35:07
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-18 01:44:58
 * @FilePath: /self-tools/server/packages/new_auth/src/utils/mod.rs
 */
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use thrift::auth::AuthErrorCode;
use tracing::{event, Level};

use self::env::{env_password, env_secret_key, env_username};

mod env;
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// 用户名
    name: String,
    /// 密码
    password: String,
    /// 超时时间
    exp: usize,
}

impl Claims {
    /// 新建
    fn new(name: String, password: String) -> Self {
        Self {
            name,
            password,
            exp: 10000000000,
        }
    }
    /// 生成 token
    fn to_token(&self) -> Result<String, AuthErrorCode> {
        let secret_key = env_secret_key()?;
        let token = encode(
            &Header::default(),
            self,
            &EncodingKey::from_secret(secret_key.as_bytes()),
        )
        .map_err(|_| AuthErrorCode::Jwt)?;
        Ok(token)
    }
    // 新建并生成token
    fn new_token(name: String, password: String) -> Result<String, AuthErrorCode> {
        Self::new(name, password).to_token()
    }
    /// 管理员 token
    pub fn manager_token(name: String, password: String) -> Result<String, AuthErrorCode> {
        let correct_username = env_username()?;
        let correct_password = env_password()?;
        if name == correct_username.as_str() && password == correct_password.as_str() {
            Claims::new_token(name, password)
        } else {
            event!(Level::WARN, "管理员密码错误: {}", name);
            Err(AuthErrorCode::PasswordError)
        }
    }
    /// 验证管理员
    pub fn check_manager(auth: String) -> Result<(), AuthErrorCode> {
        let correct_username = env_username()?;
        let correct_password = env_password()?;
        let claim = jwt_decode::<Self>(&auth)?;
        if claim.name != correct_username.as_str() || claim.password != correct_password.as_str() {
            event!(Level::WARN, "管理员密码错误: {}", claim.name);
            return Err(AuthErrorCode::PasswordError);
        };
        Ok(())
    }
}

fn jwt_decode<T: DeserializeOwned>(token: &str) -> Result<T, AuthErrorCode> {
    let secret_key = env_secret_key()?;
    let key = secret_key.as_bytes();
    match decode::<T>(
        token,
        &DecodingKey::from_secret(key),
        &Validation::default(),
    ) {
        Ok(e) => Ok(e.claims),
        Err(e) => Err(match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                event!(Level::WARN, "token 过期: {}", token);
                AuthErrorCode::AuthTimeout
            }
            _ => {
                event!(Level::WARN, "token 错误: {}", token);
                AuthErrorCode::TokenError
            }
        }),
    }
}
