use crate::router::Auth;
use async_graphql::{Context, Guard, Result};
pub(crate) struct AuthGuard;
impl Guard for AuthGuard {
    async fn check(&self, ctx: &Context<'_>) -> Result<()> {
        ctx.data_opt::<Auth>()
            .map(|_| ())
            .ok_or_else(|| graphql_common::code_error(service_errors::PublicCode::Unauthenticated))
    }
}
