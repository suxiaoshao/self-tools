use axum::Json;
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
    Json(LoginInput { username, password }): Json<LoginInput>,
) -> OpenResult<OpenResponse<String>> {
    let mut client = login_client(None).await?;
    let LoginReply { auth } = client
        .login(LoginRequest { username, password })
        .await?
        .into_inner();
    Ok(OpenResponse::new(auth))
}
