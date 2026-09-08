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
                            crate::errors::ResourceKind::Author => "AUTHOR",
                            crate::errors::ResourceKind::Tag => "TAG",
                            crate::errors::ResourceKind::Novel => "NOVEL",
                            crate::errors::ResourceKind::Chapter => "CHAPTER",
                            crate::errors::ResourceKind::Comment => "COMMENT",
                        },
                        id: r.id.to_string(),
                    })
                    .collect(),
            );
            graphql_common::public_error(error)
        }
        UseCaseError::Rejected(Rejection::Conflict(..) | Rejection::AlreadyRead(_)) => {
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
    project(ctx, f(&mut conn), success)
}
pub fn project<T, R>(
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

pub fn page(value: graphql_common::Pagination) -> Result<service_query::PageRange> {
    value.checked().map_err(|mut v| {
        v.path.insert(0, "pagination".into());
        graphql_common::invalid_fields(vec![v])
    })
}
pub fn filter(
    value: Option<graphql_common::TagMatch>,
    path: &str,
) -> Result<Option<service_query::TagFilter>> {
    if let Some(v) = &value {
        if v.match_set.is_empty() {
            return Err(read_error(crate::errors::invalid(
                &format!("{path}.matchSet"),
                service_errors::ValidationCode::Required,
            )));
        }
        for id in &v.match_set {
            crate::errors::validate_id(*id, &format!("{path}.matchSet")).map_err(read_error)?;
        }
    }
    Ok(value.map(|v| service_query::TagFilter {
        match_set: v.match_set,
        full_match: v.full_match,
    }))
}
