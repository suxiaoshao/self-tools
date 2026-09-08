//! Transport-independent use-case failures. A rejection remains an error inside a transaction.
use std::{error::Error, fmt};

use serde::{Deserialize, Serialize};

pub type BoxError = Box<dyn Error + Send + Sync + 'static>;
pub type UseCaseResult<T, R> = Result<T, UseCaseError<R>>;

#[derive(Debug, thiserror::Error)]
pub enum UseCaseError<R: Error + Send + Sync + 'static> {
    #[error("business request rejected")]
    Rejected(#[source] R),
    #[error(transparent)]
    Fault(#[from] Fault),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FaultKind {
    Database,
    Pool,
    Task,
    Network,
    Timeout,
    Protocol,
    Internal,
}

pub struct Fault {
    pub kind: FaultKind,
    pub operation: &'static str,
    pub source: BoxError,
}

impl Fault {
    pub fn new(
        kind: FaultKind,
        operation: &'static str,
        source: impl Error + Send + Sync + 'static,
    ) -> Self {
        Self {
            kind,
            operation,
            source: Box::new(source),
        }
    }

    pub fn internal(operation: &'static str) -> Self {
        Self::new(FaultKind::Internal, operation, InvariantViolation)
    }

    pub fn public_code(&self) -> PublicCode {
        match self.kind {
            FaultKind::Pool | FaultKind::Network => PublicCode::Unavailable,
            FaultKind::Timeout => PublicCode::UpstreamTimeout,
            FaultKind::Protocol => PublicCode::UpstreamFailure,
            FaultKind::Database | FaultKind::Task | FaultKind::Internal => PublicCode::Internal,
        }
    }
}

impl fmt::Debug for Fault {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Fault")
            .field("kind", &self.kind)
            .field("operation", &self.operation)
            .finish_non_exhaustive()
    }
}
impl fmt::Display for Fault {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} failed ({:?})", self.operation, self.kind)
    }
}
impl Error for Fault {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(self.source.as_ref())
    }
}

#[derive(Debug, thiserror::Error)]
#[error("internal invariant violated")]
struct InvariantViolation;

#[cfg(feature = "database")]
impl<R: Error + Send + Sync + 'static> From<diesel::result::Error> for UseCaseError<R> {
    fn from(source: diesel::result::Error) -> Self {
        let kind = match &source {
            diesel::result::Error::DatabaseError(
                diesel::result::DatabaseErrorKind::ClosedConnection
                | diesel::result::DatabaseErrorKind::UnableToSendCommand,
                _,
            ) => FaultKind::Network,
            _ => FaultKind::Database,
        };
        Fault::new(kind, "database", source).into()
    }
}
#[cfg(feature = "database")]
impl<R: Error + Send + Sync + 'static> From<diesel::r2d2::PoolError> for UseCaseError<R> {
    fn from(source: diesel::r2d2::PoolError) -> Self {
        Fault::new(FaultKind::Pool, "database_pool", source).into()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ValidationCode {
    Required,
    InvalidFormat,
    TooLong,
    OutOfRange,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct FieldViolation {
    pub path: Vec<String>,
    pub code: ValidationCode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max: Option<i64>,
}
impl FieldViolation {
    pub fn new(path: impl Into<String>, code: ValidationCode) -> Self {
        Self {
            path: vec![path.into()],
            code,
            min: None,
            max: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PublicCode {
    InvalidRequest,
    NotFound,
    RateLimited,
    Unauthenticated,
    RequestRejected,
    ReauthRequired,
    AuthenticationFailed,
    CeremonyInvalid,
    NoPasskey,
    PasskeyExists,
    Internal,
    Unavailable,
    UpstreamTimeout,
    UpstreamFailure,
}
impl PublicCode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::InvalidRequest => "INVALID_REQUEST",
            Self::NotFound => "NOT_FOUND",
            Self::RateLimited => "RATE_LIMITED",
            Self::Unauthenticated => "UNAUTHENTICATED",
            Self::RequestRejected => "REQUEST_REJECTED",
            Self::ReauthRequired => "REAUTH_REQUIRED",
            Self::AuthenticationFailed => "AUTHENTICATION_FAILED",
            Self::CeremonyInvalid => "CEREMONY_INVALID",
            Self::NoPasskey => "NO_PASSKEY",
            Self::PasskeyExists => "PASSKEY_EXISTS",
            Self::Internal => "INTERNAL",
            Self::Unavailable => "UNAVAILABLE",
            Self::UpstreamTimeout => "UPSTREAM_TIMEOUT",
            Self::UpstreamFailure => "UPSTREAM_FAILURE",
        }
    }
    pub fn status(self) -> u16 {
        match self {
            Self::InvalidRequest | Self::CeremonyInvalid => 400,
            Self::Unauthenticated | Self::AuthenticationFailed => 401,
            Self::RequestRejected | Self::ReauthRequired => 403,
            Self::NotFound => 404,
            Self::NoPasskey | Self::PasskeyExists => 409,
            Self::RateLimited => 429,
            Self::Internal => 500,
            Self::Unavailable => 503,
            Self::UpstreamTimeout => 504,
            Self::UpstreamFailure => 502,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PublicResource {
    pub kind: &'static str,
    pub id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicError {
    pub code: PublicCode,
    pub request_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub field_errors: Option<Vec<FieldViolation>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<Vec<PublicResource>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retry_after_seconds: Option<u32>,
}
impl PublicError {
    pub fn new(code: PublicCode, request_id: impl Into<String>) -> Self {
        Self {
            code,
            request_id: request_id.into(),
            field_errors: None,
            resources: None,
            retry_after_seconds: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cause_survives_but_diagnostics_and_public_projection_do_not_dump_it() {
        let fault = Fault::new(
            FaultKind::Protocol,
            "decode_upstream",
            std::io::Error::other("password=secret&content=private"),
        );
        assert!(
            fault
                .source()
                .unwrap()
                .downcast_ref::<std::io::Error>()
                .is_some()
        );
        assert!(!format!("{fault:?} {fault}").contains("secret"));
        let public =
            serde_json::to_string(&PublicError::new(fault.public_code(), "a".repeat(32))).unwrap();
        assert!(!public.contains("source"));
        assert!(!public.contains("private"));
        assert!(public.contains("UPSTREAM_FAILURE"));
    }
}

/// Shared existing directory naming rule, evaluated as a business rejection.
pub fn directory_name(value: &str, path: &str) -> Result<(), FieldViolation> {
    let length = value.chars().count();
    if length == 0 || value.chars().all(|c| c == ' ') {
        return Err(FieldViolation {
            path: vec![path.into()],
            code: ValidationCode::Required,
            min: Some(1),
            max: None,
        });
    }
    if length > 255 {
        return Err(FieldViolation {
            path: vec![path.into()],
            code: ValidationCode::TooLong,
            min: None,
            max: Some(255),
        });
    }
    if matches!(value, "." | "..") || value.chars().any(|c| matches!(c, '/' | '\n' | '\r' | '\t')) {
        return Err(FieldViolation::new(path, ValidationCode::InvalidFormat));
    }
    Ok(())
}
