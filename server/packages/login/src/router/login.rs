use axum::{extract::rejection::JsonRejection, Json};
use proto::{
    auth::{LoginReply, LoginRequest},
    middleware::client::login_client,
};
use serde::Deserialize;
use tracing::{event, Level};

use crate::errors::{response::OpenResponse, OpenResult};
#[derive(Deserialize, Debug)]
pub struct LoginInput {
    username: String,
    password: String,
}
pub(crate) async fn login(
    json: Result<Json<LoginInput>, JsonRejection>,
) -> OpenResult<OpenResponse<String>> {
    let span = tracing::info_span!("login");
    let _enter = span.enter();
    event!(Level::INFO, "login start");
    let Json(LoginInput { username, password }) = json?;
    event!(Level::INFO, "login request: {}", &username);
    let mut client = login_client(None).await?;
    let LoginReply { auth } = client
        .login(LoginRequest { username, password })
        .await?
        .into_inner();
    event!(Level::INFO, "login success");
    Ok(OpenResponse::new(auth))
}
