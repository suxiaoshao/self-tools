use crate::{errors::GraphqlError, router::Auth};
use async_graphql::{Context, Guard, Result};
#[derive(Default)]
pub(crate) struct AuthGuard;
impl Guard for AuthGuard {
    async fn check(&self, ctx: &Context<'_>) -> Result<()> {
        ctx.data_opt::<Auth>()
            .ok_or(GraphqlError::Unauthenticated)?;
        Ok(())
    }
}
