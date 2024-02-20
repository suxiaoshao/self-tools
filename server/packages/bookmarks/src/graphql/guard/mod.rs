/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-20 15:32:04
 * @FilePath: /self-tools/server/packages/collections/src/graphql/guard/mod.rs
 */
use async_graphql::{Context, Guard, Result};
use middleware::TraceIdExt;
use thrift::{auth::CheckRequest, get_client};
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    router::Auth,
};

#[derive(Default)]
pub struct AuthGuard;
impl Guard for AuthGuard {
    async fn check(&self, ctx: &Context<'_>) -> Result<()> {
        let auth = ctx.data_opt::<Auth>();
        let trace_id = &ctx.data::<TraceIdExt>()?.0;
        check(auth, trace_id).await?;
        Ok(())
    }
}

async fn check(auth: Option<&Auth>, trace_id: &str) -> GraphqlResult<()> {
    let auth = if let Some(auth_header) = auth.map(|x| &x.0) {
        auth_header
    } else {
        event!(Level::WARN, "graphql context 缺少 Auth");
        return Err(GraphqlError::Unauthenticated);
    }
    .to_string();
    event!(Level::INFO, "rpc login client");
    let client = get_client()?;
    event!(Level::INFO, "rpc check call");
    let trace_id = trace_id.to_string().into();
    client
        .check(CheckRequest {
            auth: auth.into(),
            trace_id,
        })
        .await?;
    event!(Level::INFO, "rpc check success");
    Ok(())
}
