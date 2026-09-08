use std::time::Instant;
use telemetry::{IngressTrust, OpenTelemetrySpanExt, PropagationFields, RequestCorrelation};

/// Pingora owns this until its final logging callback (after downstream body delivery).
/// Drop covers cancellation before that callback, including failures before headers.
pub struct RequestTrace {
    pub server: tracing::Span,
    client: Option<tracing::Span>,
    pub correlation: RequestCorrelation,
    pub method: &'static str,
    pub route: &'static str,
    started: Instant,
    client_started: Option<Instant>,
    pub upstream_status: Option<u16>,
    pub upstream_eof: bool,
    done: bool,
}
impl RequestTrace {
    pub fn new() -> Self {
        let (parent, correlation) =
            telemetry::extract(&PropagationFields::default(), IngressTrust::Public);
        let server = tracing::info_span!(target:"telemetry","http.server",otel.kind="server");
        let _ = server.set_parent(parent);
        Self {
            server,
            client: None,
            correlation,
            method: "other",
            route: "other",
            started: Instant::now(),
            client_started: None,
            upstream_status: None,
            upstream_eof: false,
            done: false,
        }
    }
    pub fn start_upstream(&mut self) {
        // An independently retried connection attempt must not silently reuse the prior span.
        if let Some(previous) = self.client.take() {
            self.emit(
                &previous,
                self.client_started.unwrap_or(self.started),
                None,
                false,
            );
        }
        let client = tracing::info_span!(target:"telemetry",parent:&self.server,"http.client",otel.kind="client");
        let _ = client.set_parent(self.server.context());
        self.client = Some(client);
        self.client_started = Some(Instant::now());
        self.upstream_status = None;
        self.upstream_eof = false;
    }
    pub fn outgoing(&self) -> PropagationFields {
        telemetry::inject(
            &self.client.as_ref().unwrap_or(&self.server).context(),
            &self.correlation,
        )
    }
    pub fn finish(&mut self, status: Option<u16>, delivered: bool, upstream_completed: bool) {
        if self.done {
            return;
        }
        self.done = true;
        if let Some(client) = self.client.take() {
            self.emit(
                &client,
                self.client_started.unwrap_or(self.started),
                self.upstream_status,
                upstream_completed || self.upstream_eof,
            );
        }
        self.emit(&self.server, self.started, status, delivered);
    }
    fn emit(&self, span: &tracing::Span, started: Instant, status: Option<u16>, complete: bool) {
        span.in_scope(|| {
            let duration_ms=started.elapsed().as_millis() as u64;
            if complete {
                let outcome=match status {Some(500..)=>"fault",Some(400..)=>"rejected",_=>"success"};
                tracing::info!(target:"telemetry",event="http.completed",method=self.method,route=self.route,status=status.unwrap_or(0) as u64,duration_ms,outcome);
            } else if let Some(status)=status {
                tracing::warn!(target:"telemetry",event="http.interrupted",method=self.method,route=self.route,status=status as u64,duration_ms,stage="body");
            } else {
                tracing::warn!(target:"telemetry",event="http.interrupted",method=self.method,route=self.route,duration_ms,stage="headers");
            }
        });
    }
}
impl Drop for RequestTrace {
    fn drop(&mut self) {
        self.finish(None, false, false);
    }
}
pub fn method(value: &str) -> &'static str {
    match value {
        "GET" => "GET",
        "POST" => "POST",
        "PUT" => "PUT",
        "PATCH" => "PATCH",
        "DELETE" => "DELETE",
        "HEAD" => "HEAD",
        "OPTIONS" => "OPTIONS",
        _ => "other",
    }
}
