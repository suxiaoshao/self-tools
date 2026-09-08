use crate::{
    errors::{AppError, AppResult, Rejection},
    model::PgPool,
};
use async_graphql::{Context, Result};
use service_errors::{Fault, FaultKind, PublicCode, PublicError, PublicResource, UseCaseError};
pub fn read_error(error: AppError) -> async_graphql::Error {
    match error {
        UseCaseError::Fault(fault) => graphql_common::fault_error(fault),
        UseCaseError::Rejected(Rejection::Validation(issues)) => {
            graphql_common::invalid_fields(issues)
        }
        UseCaseError::Rejected(Rejection::Missing(resources)) => {
            let mut error = PublicError::new(
                PublicCode::NotFound,
                telemetry::current_correlation()
                    .unwrap_or_default()
                    .request_id,
            );
            error.resources = Some(
                resources
                    .into_iter()
                    .map(|r| PublicResource {
                        kind: match r.kind {
                            crate::errors::ResourceKind::Collection => "COLLECTION",
                            crate::errors::ResourceKind::Item => "ITEM",
                        },
                        id: r.id.to_string(),
                    })
                    .collect(),
            );
            graphql_common::public_error(error)
        }
        UseCaseError::Rejected(Rejection::Conflict(..)) => {
            graphql_common::fault_error(Fault::internal("query_rejection"))
        }
    }
}
pub fn pool<'a>(ctx: &'a Context<'_>) -> Result<&'a PgPool> {
    ctx.data_opt()
        .ok_or_else(|| graphql_common::fault_error(Fault::internal("graphql_pool")))
}
pub fn with_conn<T>(
    ctx: &Context<'_>,
    f: impl FnOnce(&mut diesel::PgConnection) -> AppResult<T>,
) -> Result<T> {
    let mut conn = pool(ctx)?.get().map_err(|e| {
        graphql_common::fault_error(Fault::new(FaultKind::Pool, "database_pool", e))
    })?;
    f(&mut conn).map_err(read_error)
}
pub fn detail<T>(result: AppResult<T>) -> AppResult<Option<T>> {
    match result {
        Ok(v) => Ok(Some(v)),
        Err(UseCaseError::Rejected(Rejection::Missing(_))) => Ok(None),
        Err(e) => Err(e),
    }
}
pub fn write<T, R>(
    ctx: &Context<'_>,
    f: impl FnOnce(&mut diesel::PgConnection) -> AppResult<T>,
    success: impl FnOnce(T) -> R,
) -> Result<R>
where
    R: TryFrom<Rejection, Error = Rejection>,
{
    let mut conn = pool(ctx)?.get().map_err(|e| {
        graphql_common::fault_error(Fault::new(FaultKind::Pool, "database_pool", e))
    })?;
    match f(&mut conn) {
        Ok(v) => Ok(success(v)),
        Err(UseCaseError::Fault(fault)) => Err(graphql_common::fault_error(fault)),
        Err(UseCaseError::Rejected(rejection)) => {
            let result = R::try_from(rejection)
                .map_err(|_| graphql_common::fault_error(Fault::internal("mutation_rejection")))?;
            if let Some(state) = ctx.data_opt::<std::sync::Arc<graphql_common::OperationState>>() {
                state.reject();
            }
            Ok(result)
        }
    }
}
