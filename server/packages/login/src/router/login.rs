/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-14 11:04:19
 * @FilePath: /self-tools/server/packages/login/src/router/login.rs
 */
use axum::{
    extract::rejection::{ExtensionRejection, JsonRejection},
    Extension, Json,
};
use middleware::TraceIdExt;
use serde::Deserialize;
use thrift::{
    auth::{LoginReply, LoginRequest},
    get_client,
};
use tracing::{event, Level};

use crate::errors::{response::OpenResponse, OpenResult};
#[derive(Deserialize, Debug)]
pub struct LoginInput {
    username: String,
    password: String,
}
pub(crate) async fn login(
    trace_id: Result<Extension<TraceIdExt>, ExtensionRejection>,
    json: Result<Json<LoginInput>, JsonRejection>,
) -> OpenResult<OpenResponse<String>> {
    let span = tracing::info_span!("login");
    let _enter = span.enter();
    event!(Level::INFO, "login start");
    let trace_id = trace_id.map(|x| x.0).map(|x| x.0)?;
    let Json(LoginInput { username, password }) = json?;
    event!(Level::INFO, "login request: {}", &username);
    let client = get_client()?;
    event!(Level::INFO, "rpc login call");
    let LoginReply { auth } = match client
        .login(LoginRequest {
            username: username.into(),
            password: password.into(),
            trace_id: trace_id.into(),
        })
        .await?
    {
        volo_thrift::MaybeException::Ok(data) => data,
        volo_thrift::MaybeException::Exception(err) => return Err(err.into()),
    };
    event!(Level::INFO, "login success");
    Ok(OpenResponse::new(auth.to_string()))
}
