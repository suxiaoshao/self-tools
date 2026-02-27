/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-14 11:39:59
 * @FilePath: /self-tools/server/packages/collections/src/graphql/guard/mod.rs
 */
use async_graphql::{Context, Guard, Result};
use middleware::TraceIdExt;
use thrift::{auth::CheckRequest, get_client};
use tracing::{Level, event};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    router::Auth,
};

#[derive(Default)]
pub(crate) struct AuthGuard;
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
    match client
        .check(CheckRequest {
            auth: auth.into(),
            trace_id,
        })
        .await?
    {
        volo_thrift::MaybeException::Ok(_) => {}
        volo_thrift::MaybeException::Exception(err) => {
            event!(Level::ERROR, "rpc check error:{:?}", err);
            return Err(err.into());
        }
    };
    event!(Level::INFO, "rpc check success");
    Ok(())
}
