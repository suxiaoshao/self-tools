use opentelemetry::trace::TraceContextExt;
use serde_json::{Map, Value};
use std::{
    fmt,
    io::Write,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};
use tracing::{
    Event, Subscriber,
    field::{Field, Visit},
};
use tracing_opentelemetry::OpenTelemetrySpanExt;
use tracing_subscriber::{Layer, layer::Context, registry::LookupSpan};

pub(crate) struct SafeJsonLayer {
    pub service: &'static str,
}
impl<S: Subscriber + for<'a> LookupSpan<'a>> Layer<S> for SafeJsonLayer {
    fn on_event(&self, event: &Event<'_>, _ctx: Context<'_, S>) {
        let metadata = event.metadata();
        if metadata.target().starts_with("opentelemetry") {
            if *metadata.level() <= tracing::Level::WARN {
                sdk_warning();
            }
            return;
        }
        if metadata.target() != "telemetry" {
            return;
        }
        let mut visitor = SafeFields::default();
        event.record(&mut visitor);
        if !visitor.0.contains_key("event") {
            return;
        }
        let context = tracing::Span::current().context();
        let span = context.span();
        let sc = span.span_context();
        if sc.is_valid() {
            visitor
                .0
                .insert("trace_id".into(), sc.trace_id().to_string().into());
            visitor
                .0
                .insert("span_id".into(), sc.span_id().to_string().into());
        }
        if let Some(correlation) = context.get::<crate::RequestCorrelation>() {
            visitor
                .0
                .insert("request_id".into(), correlation.request_id.clone().into());
        }
        visitor.0.insert("timestamp".into(), now_ms().into());
        visitor.0.insert("service".into(), self.service.into());
        visitor
            .0
            .insert("level".into(), metadata.level().as_str().into());
        let mut stdout = std::io::stdout().lock();
        if serde_json::to_writer(&mut stdout, &visitor.0).is_ok() {
            let _ = stdout.write_all(b"\n");
        }
    }
}
fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
fn sdk_warning() {
    static LAST: AtomicU64 = AtomicU64::new(0);
    let now = now_ms();
    let last = LAST.load(Ordering::Relaxed);
    if now.saturating_sub(last) >= 60_000
        && LAST
            .compare_exchange(last, now, Ordering::Relaxed, Ordering::Relaxed)
            .is_ok()
    {
        let _ = writeln!(
            std::io::stderr().lock(),
            "{{\"event\":\"telemetry.warning\",\"code\":\"SDK_DIAGNOSTIC\"}}"
        );
    }
}
#[derive(Default)]
struct SafeFields(Map<String, Value>);
fn allowed(name: &str) -> bool {
    matches!(
        name,
        "event"
            | "method"
            | "route"
            | "status"
            | "duration_ms"
            | "outcome"
            | "stage"
            | "rpc_service"
            | "rpc_method"
            | "code"
            | "operation_type"
            | "operation_name"
            | "error_count"
            | "operation"
            | "cause_kind"
            | "cause_code"
    )
}
impl Visit for SafeFields {
    fn record_str(&mut self, field: &Field, value: &str) {
        if allowed(field.name()) {
            self.0.insert(field.name().into(), value.into());
        }
    }
    fn record_u64(&mut self, field: &Field, value: u64) {
        if allowed(field.name()) {
            self.0.insert(field.name().into(), value.into());
        }
    }
    fn record_i64(&mut self, field: &Field, value: i64) {
        if allowed(field.name()) {
            self.0.insert(field.name().into(), value.into());
        }
    }
    // Never render Debug or Display wrappers: they may contain arbitrary source payloads.
    fn record_debug(&mut self, _: &Field, _: &dyn fmt::Debug) {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};
    use tracing_subscriber::prelude::*;
    struct Capture(Arc<Mutex<Map<String, Value>>>);
    impl<S: Subscriber> Layer<S> for Capture {
        fn on_event(&self, event: &Event<'_>, _: Context<'_, S>) {
            let mut visitor = SafeFields::default();
            event.record(&mut visitor);
            *self.0.lock().unwrap() = visitor.0;
        }
    }
    #[test]
    fn arbitrary_payloads_and_formatted_errors_are_not_rendered() {
        let output = Arc::new(Mutex::new(Map::new()));
        tracing::subscriber::with_default(
            tracing_subscriber::registry().with(Capture(output.clone())),
            || {
                tracing::error!(event = "fault", cause_kind = "database", password = "secret", body = "private",
                cause_code = ?std::io::Error::other("secret"), "token=secret");
            },
        );
        let output = output.lock().unwrap();
        assert_eq!(output.len(), 2);
        assert!(!serde_json::to_string(&*output).unwrap().contains("secret"));
    }
}
