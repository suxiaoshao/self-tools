use axum::{
    http::{header::SET_COOKIE, HeaderMap, HeaderValue},
    Json,
};
use proto::{
    auth::{LoginReply, LoginRequest},
    middleware::client::login_client,
};
use serde::Deserialize;

use crate::errors::OpenResult;
#[derive(Deserialize, Debug)]
pub struct LoginInput {
    username: String,
    password: String,
}
pub(crate) async fn login(
    Json(LoginInput { username, password }): Json<LoginInput>,
) -> OpenResult<HeaderMap> {
    let mut client = login_client(None).await?;
    let LoginReply { auth } = client
        .login(LoginRequest { username, password })
        .await?
        .into_inner();
    let mut headers = HeaderMap::new();
    let set_cookie = HeaderValue::from_str(&format!("auth={auth}; domain=.sushao.top"))?;
    headers.insert(SET_COOKIE, set_cookie);
    Ok(headers)
}
