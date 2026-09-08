//! Shared SDK lifecycle, trusted propagation and allowlisted diagnostic output.
mod config;
mod logging;
mod propagation;
mod rpc;
pub use rpc::RpcCompletion;

pub use config::{InitError, ShutdownError, TelemetryGuard, init};
pub use opentelemetry;
pub use propagation::{
    IngressTrust, PropagationFields, RequestCorrelation, current_correlation, extract, inject,
};
pub use tracing_opentelemetry::OpenTelemetrySpanExt;

/// The owner of a fault records its classification, never the source's Display/Debug.
pub fn record_fault(fault: &service_errors::Fault) {
    let kind = match fault.kind {
        service_errors::FaultKind::Database => "database",
        service_errors::FaultKind::Pool => "pool",
        service_errors::FaultKind::Task => "task",
        service_errors::FaultKind::Network => "network",
        service_errors::FaultKind::Timeout => "timeout",
        service_errors::FaultKind::Protocol => "protocol",
        service_errors::FaultKind::Internal => "internal",
    };
    tracing::error!(target: "telemetry", event = "fault", operation = fault.operation,
        cause_kind = kind, cause_code = fault.public_code().as_str());
}

#[cfg(test)]
mod tests;
