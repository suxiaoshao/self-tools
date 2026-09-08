use async_graphql::{Error, ErrorExtensionValues};
use service_errors::{Fault, PublicCode, PublicError};
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
/// Per-request rejection state, populated by typed result adapters without inspecting response data.
#[derive(Default)]
pub struct OperationState {
    rejected: AtomicBool,
}
impl OperationState {
    pub fn reject(&self) {
        self.rejected.store(true, Ordering::Relaxed);
    }
    pub fn rejected(&self) -> bool {
        self.rejected.load(Ordering::Relaxed)
    }
}
pub fn public_error(value: PublicError) -> Error {
    let mut extensions = ErrorExtensionValues::default();
    if let Ok(serde_json::Value::Object(fields)) = serde_json::to_value(&value) {
        for (key, value) in fields {
            if let Ok(value) = async_graphql::Value::from_json(value) {
                extensions.set(key, value);
            }
        }
    }
    Error {
        message: value.code.as_str().into(),
        source: None,
        extensions: Some(extensions),
    }
}
pub fn code_error(code: PublicCode) -> Error {
    public_error(PublicError::new(
        code,
        telemetry::current_correlation()
            .unwrap_or_default()
            .request_id,
    ))
}
pub fn fault_error(fault: Fault) -> Error {
    telemetry::record_fault(&fault);
    let mut error = code_error(fault.public_code());
    error.source = Some(Arc::new(fault));
    error
}
pub fn invalid_fields(fields: Vec<service_errors::FieldViolation>) -> Error {
    let mut error = PublicError::new(
        PublicCode::InvalidRequest,
        telemetry::current_correlation()
            .unwrap_or_default()
            .request_id,
    );
    error.field_errors = Some(fields);
    public_error(error)
}
