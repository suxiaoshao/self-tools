use axum::{extract::rejection::JsonRejection, Json};
use proto::{
    auth::{LoginReply, LoginRequest},
    middleware::client::login_client,
};
use serde::Deserialize;

use crate::errors::{response::OpenResponse, OpenResult};
#[derive(Deserialize, Debug)]
pub struct LoginInput {
    username: String,
    password: String,
}
pub(crate) async fn login(
    json: Result<Json<LoginInput>, JsonRejection>,
) -> OpenResult<OpenResponse<String>> {
    let Json(LoginInput { username, password }) = json?;
    let mut client = login_client(None).await?;
    let LoginReply { auth } = client
        .login(LoginRequest { username, password })
        .await?
        .into_inner();
    Ok(OpenResponse::new(auth))
}
