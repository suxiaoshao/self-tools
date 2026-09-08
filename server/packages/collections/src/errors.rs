//! Application failures contain domain data and typed causes, never GraphQL values.
use service_errors::{FieldViolation, UseCaseError, UseCaseResult};
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ResourceKind {
    Collection,
    Item,
}
#[derive(Debug, Clone)]
pub(crate) struct ResourceRef {
    pub kind: ResourceKind,
    pub id: i64,
}
#[derive(Debug, Clone, Copy)]
pub(crate) enum ConflictReason {
    CollectionPathExists,
    MembershipExists,
}
#[derive(Debug, thiserror::Error)]
pub(crate) enum Rejection {
    #[error("validation failed")]
    Validation(Vec<FieldViolation>),
    #[error("resources missing")]
    Missing(Vec<ResourceRef>),
    #[error("conflict")]
    Conflict(ConflictReason, Vec<ResourceRef>),
}
pub(crate) type AppError = UseCaseError<Rejection>;
pub(crate) type AppResult<T> = UseCaseResult<T, Rejection>;
pub(crate) fn missing(kind: ResourceKind, id: i64) -> AppError {
    UseCaseError::Rejected(Rejection::Missing(vec![ResourceRef { kind, id }]))
}
pub(crate) fn conflict(reason: ConflictReason, resources: Vec<ResourceRef>) -> AppError {
    UseCaseError::Rejected(Rejection::Conflict(reason, resources))
}
pub(crate) fn validate_id(id: i64, path: &str) -> AppResult<()> {
    if id <= 0 {
        return Err(UseCaseError::Rejected(Rejection::Validation(vec![
            FieldViolation {
                path: path.split('.').map(str::to_owned).collect(),
                code: service_errors::ValidationCode::OutOfRange,
                min: Some(1),
                max: None,
            },
        ])));
    }
    Ok(())
}
pub(crate) fn validate_name(name: &str) -> AppResult<()> {
    service_errors::directory_name(name, "name")
        .map_err(|v| UseCaseError::Rejected(Rejection::Validation(vec![v])))
}
/// Map only this operation's known unique constraint after transaction rollback.
pub(crate) fn path_conflict(error: AppError) -> AppError {
    if let UseCaseError::Fault(fault) = &error
        && let Some(diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UniqueViolation,
            info,
        )) = fault.source.downcast_ref::<diesel::result::Error>()
        && info.constraint_name() == Some("collection_path_key")
    {
        return conflict(ConflictReason::CollectionPathExists, vec![]);
    }
    error
}
