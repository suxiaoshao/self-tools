use std::time::Instant;
/// Retains the RPC span until the response is classified or its future is dropped.
pub struct RpcCompletion {
    span: tracing::Span,
    method: &'static str,
    started: Instant,
    done: bool,
}
impl RpcCompletion {
    pub fn new(span: tracing::Span, method: &'static str) -> Self {
        Self {
            span,
            method,
            started: Instant::now(),
            done: false,
        }
    }
    pub fn finish(&mut self, outcome: &'static str, code: Option<&'static str>) {
        if self.done {
            return;
        }
        self.done = true;
        self.span.in_scope(|| {
            if let Some(code) = code {
                tracing::info!(target: "telemetry", event = "rpc.completed", rpc_service = "auth", rpc_method = self.method,
                    duration_ms = self.started.elapsed().as_millis() as u64, outcome, code);
            } else {
                tracing::info!(target: "telemetry", event = "rpc.completed", rpc_service = "auth", rpc_method = self.method,
                    duration_ms = self.started.elapsed().as_millis() as u64, outcome);
            }
        });
    }
}
impl Drop for RpcCompletion {
    fn drop(&mut self) {
        if !self.done {
            self.span.in_scope(|| tracing::warn!(target: "telemetry", event = "rpc.interrupted", rpc_service = "auth",
                rpc_method = self.method, duration_ms = self.started.elapsed().as_millis() as u64, stage = "response"));
        }
    }
}
