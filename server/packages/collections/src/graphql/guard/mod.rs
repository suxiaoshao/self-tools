use async_graphql::{async_trait, Context, Guard, Result};
use proto::{auth::CheckRequest, middleware::client::login_client};

use crate::errors::{GraphqlError, GraphqlResult};

#[derive(Default)]
pub struct AuthGuard;
#[async_trait::async_trait]
impl Guard for AuthGuard {
    async fn check(&self, ctx: &Context<'_>) -> Result<()> {
        let data = ctx.data_opt::<String>();
        check(data).await?;
        Ok(())
    }
}

async fn check(token: Option<&String>) -> GraphqlResult<()> {
    let auth = if let Some(auth_header) = token {
        auth_header
    } else {
        return Err(GraphqlError::Unauthenticated);
    }
    .to_string();
    let mut client = login_client(None).await?;
    client.check(CheckRequest { auth }).await?;
    Ok(())
}
