use crate::{
    application::Application,
    errors::{AppError, AppResult, Rejection},
};
use async_graphql::{Context, Result};
use service_errors::{Fault, PublicCode, PublicError, PublicResource, UseCaseError};
pub(super) fn read_error(error: AppError) -> async_graphql::Error {
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
pub(super) fn application<'a>(ctx: &'a Context<'_>) -> Result<&'a std::sync::Arc<Application>> {
    ctx.data_opt()
        .ok_or_else(|| graphql_common::fault_error(Fault::internal("graphql_application")))
}
pub(super) fn project<T, R>(
    ctx: &Context<'_>,
    result: AppResult<T>,
    success: impl FnOnce(T) -> R,
) -> Result<R>
where
    R: TryFrom<Rejection, Error = Rejection>,
{
    match result {
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
