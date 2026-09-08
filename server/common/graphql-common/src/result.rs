use async_graphql::{Enum, SimpleObject};
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ValidationCode {
    Required,
    InvalidFormat,
    TooLong,
    OutOfRange,
}
#[derive(SimpleObject)]
pub struct FieldViolation {
    pub path: Vec<String>,
    pub code: ValidationCode,
    pub min: Option<i64>,
    pub max: Option<i64>,
}
impl From<service_errors::FieldViolation> for FieldViolation {
    fn from(v: service_errors::FieldViolation) -> Self {
        Self {
            path: v.path,
            code: match v.code {
                service_errors::ValidationCode::Required => ValidationCode::Required,
                service_errors::ValidationCode::InvalidFormat => ValidationCode::InvalidFormat,
                service_errors::ValidationCode::TooLong => ValidationCode::TooLong,
                service_errors::ValidationCode::OutOfRange => ValidationCode::OutOfRange,
            },
            min: v.min,
            max: v.max,
        }
    }
}
#[derive(SimpleObject)]
pub struct ValidationFailure {
    pub issues: Vec<FieldViolation>,
}
impl From<Vec<service_errors::FieldViolation>> for ValidationFailure {
    fn from(v: Vec<service_errors::FieldViolation>) -> Self {
        Self {
            issues: v.into_iter().map(Into::into).collect(),
        }
    }
}
