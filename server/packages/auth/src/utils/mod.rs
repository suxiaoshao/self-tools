use errors::{TonicError, TonicResult};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use crate::{PASSWORD, SECRET_KEY, USERNAME};

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
    fn to_token(&self) -> TonicResult<String> {
        let token = encode(
            &Header::default(),
            self,
            &EncodingKey::from_secret(SECRET_KEY.as_bytes()),
        )?;
        Ok(token)
    }
    // 新建并生成token
    fn new_token(name: String, password: String) -> TonicResult<String> {
        Self::new(name, password).to_token()
    }
    /// 管理员 token
    pub fn manager_token(name: String, password: String) -> TonicResult<String> {
        if name == USERNAME.as_str() && password == PASSWORD.as_str() {
            Claims::new_token(name, password)
        } else {
            Err(TonicError::PasswordError)
        }
    }
    /// 验证管理员
    pub fn check_manager(auth: String) -> TonicResult<()> {
        let chaim = jwt_decode::<Self>(&auth)?;
        if chaim.name != USERNAME.as_str() || chaim.password != PASSWORD.as_str() {
            return Err(TonicError::PasswordError);
        };
        Ok(())
    }
}

fn jwt_decode<T: DeserializeOwned>(token: &str) -> TonicResult<T> {
    let key = SECRET_KEY.as_bytes();
    match decode::<T>(
        token,
        &DecodingKey::from_secret(key),
        &Validation::default(),
    ) {
        Ok(e) => Ok(e.claims),
        Err(e) => Err(match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => TonicError::AuthTimeout,
            _ => TonicError::TokenError,
        }),
    }
}
