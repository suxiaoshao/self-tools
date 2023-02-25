use async_graphql::{async_trait, Context, Guard, Result};
use middleware::TraceIdExt;
use proto::{auth::CheckRequest, middleware::client::login_client};
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    router::Auth,
};

#[derive(Default)]
pub struct AuthGuard;
#[async_trait::async_trait]
impl Guard for AuthGuard {
    async fn check(&self, ctx: &Context<'_>) -> Result<()> {
        let auth = ctx.data_opt::<Auth>();
        let trace_id = ctx.data_opt::<TraceIdExt>();
        check(auth, trace_id).await?;
        Ok(())
    }
}

async fn check(auth: Option<&Auth>, trace_id: Option<&TraceIdExt>) -> GraphqlResult<()> {
    let auth = if let Some(auth_header) = auth.map(|x| &x.0) {
        auth_header
    } else {
        event!(Level::WARN, "graphql context 缺少 Auth");
        return Err(GraphqlError::Unauthenticated);
    }
    .to_string();
    event!(Level::INFO, "rpc login client");
    let mut client = login_client(None, trace_id.map(|x| &x.0).cloned()).await?;
    event!(Level::INFO, "rpc check call");
    client.check(CheckRequest { auth }).await?;
    event!(Level::INFO, "rpc check success");
    Ok(())
}
