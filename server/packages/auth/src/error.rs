use service_errors::{Fault, FaultKind, FieldViolation, UseCaseError, UseCaseResult};
#[derive(Debug, thiserror::Error)]
pub enum Rejection {
    #[error("unauthenticated")]
    Unauthenticated,
    #[error("recent authentication required")]
    ReauthRequired,
    #[error("authentication failed")]
    AuthenticationFailed,
    #[error("ceremony invalid")]
    CeremonyInvalid,
    #[error("no passkey")]
    NoPasskey,
    #[error("passkey exists")]
    PasskeyExists,
    #[error("invalid request")]
    InvalidRequest(Vec<FieldViolation>),
    #[error("not found")]
    NotFound(String),
    #[error("rate limited")]
    RateLimited,
}
pub type Error = UseCaseError<Rejection>;
pub type Result<T> = UseCaseResult<T, Rejection>;
impl From<Rejection> for Error {
    fn from(value: Rejection) -> Self {
        Self::Rejected(value)
    }
}
#[derive(Debug, thiserror::Error)]
#[error("authentication shared state is poisoned")]
struct PoisonedState;
pub fn poisoned() -> Error {
    Fault::new(FaultKind::Internal, "authentication_state", PoisonedState).into()
}
pub fn fault(
    operation: &'static str,
    source: impl std::error::Error + Send + Sync + 'static,
) -> Error {
    Fault::new(FaultKind::Internal, operation, source).into()
}

pub fn invalid(path: &'static str, code: service_errors::ValidationCode) -> Error {
    Rejection::InvalidRequest(vec![FieldViolation::new(path, code)]).into()
}
