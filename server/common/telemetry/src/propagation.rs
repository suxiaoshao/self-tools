use opentelemetry::{Context, propagation::TextMapPropagator};
use opentelemetry_sdk::propagation::TraceContextPropagator;
use std::collections::HashMap;
use tracing_opentelemetry::OpenTelemetrySpanExt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestCorrelation {
    pub request_id: String,
}
impl Default for RequestCorrelation {
    fn default() -> Self {
        let id = loop {
            let id: u128 = rand::random();
            if id != 0 {
                break id;
            }
        };
        Self {
            request_id: format!("{id:032x}"),
        }
    }
}
#[derive(Debug, Clone, Default)]
pub struct PropagationFields {
    pub traceparent: String,
    pub tracestate: Option<String>,
    pub request_id: String,
}
#[derive(Debug, Clone, Copy)]
pub enum IngressTrust {
    Public,
    Internal,
}

pub fn extract(fields: &PropagationFields, trust: IngressTrust) -> (Context, RequestCorrelation) {
    let mut context = Context::new();
    let mut correlation = RequestCorrelation::default();
    if matches!(trust, IngressTrust::Internal) {
        let mut carrier = HashMap::from([("traceparent".to_owned(), fields.traceparent.clone())]);
        if let Some(state) = &fields.tracestate {
            carrier.insert("tracestate".to_owned(), state.clone());
        }
        context = TraceContextPropagator::new().extract_with_context(&context, &carrier);
        if valid_request_id(&fields.request_id) {
            correlation.request_id.clone_from(&fields.request_id);
        }
    }
    (context.with_value(correlation.clone()), correlation)
}

pub fn inject(context: &Context, correlation: &RequestCorrelation) -> PropagationFields {
    let mut carrier = HashMap::new();
    TraceContextPropagator::new().inject_context(context, &mut carrier);
    PropagationFields {
        traceparent: carrier.remove("traceparent").unwrap_or_default(),
        tracestate: carrier
            .remove("tracestate")
            .filter(|value| !value.is_empty()),
        request_id: correlation.request_id.clone(),
    }
}

pub fn current_correlation() -> Option<RequestCorrelation> {
    tracing::Span::current()
        .context()
        .get::<RequestCorrelation>()
        .cloned()
}

fn valid_request_id(value: &str) -> bool {
    value.len() == 32
        && value
            .bytes()
            .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
        && value.bytes().any(|c| c != b'0')
}

#[cfg(test)]
mod tests {
    use super::*;
    use opentelemetry::trace::{TraceContextExt, TracerProvider};
    use opentelemetry_sdk::trace::{Sampler, SdkTracerProvider};
    use tracing_subscriber::prelude::*;

    #[test]
    fn sdk_propagates_distinct_spans_and_correlation_without_an_exporter_even_unsampled() {
        for sampler in [Sampler::AlwaysOn, Sampler::AlwaysOff] {
            let provider = SdkTracerProvider::builder().with_sampler(sampler).build();
            let subscriber = tracing_subscriber::registry()
                .with(tracing_opentelemetry::layer().with_tracer(provider.tracer("test")));
            tracing::subscriber::with_default(subscriber, || {
                let (root, correlation) =
                    extract(&PropagationFields::default(), IngressTrust::Public);
                let gateway = tracing::info_span!("gateway");
                gateway.set_parent(root).unwrap();
                gateway.in_scope(|| {
                    assert_eq!(current_correlation(), Some(correlation.clone()));
                    let fields = inject(&gateway.context(), &correlation);
                    assert!(!fields.traceparent.is_empty());
                    let (parent, forwarded) = extract(&fields, IngressTrust::Internal);
                    let service = tracing::info_span!("service");
                    service.set_parent(parent).unwrap();
                    let gateway_context = gateway.context();
                    let service_context = service.context();
                    let g = gateway_context.span();
                    let s = service_context.span();
                    assert!(s.span_context().is_valid());
                    assert_eq!(g.span_context().trace_id(), s.span_context().trace_id());
                    assert_ne!(g.span_context().span_id(), s.span_context().span_id());
                    assert_eq!(forwarded, correlation);
                    service
                        .in_scope(|| assert_eq!(current_correlation(), Some(correlation.clone())));
                });
            });
            provider.shutdown().unwrap();
        }
    }

    #[test]
    fn public_ids_are_discarded_and_invalid_internal_parents_do_not_keep_state() {
        let fields = PropagationFields {
            traceparent: "00-11111111111111111111111111111111-2222222222222222-01".into(),
            tracestate: Some("tenant=secret".into()),
            request_id: "a".repeat(32),
        };
        let (public, correlation) = extract(&fields, IngressTrust::Public);
        assert!(!public.span().span_context().is_valid());
        assert_ne!(correlation.request_id, fields.request_id);
        let invalid = PropagationFields {
            traceparent: "bad".into(),
            request_id: "injected-secret".into(),
            ..fields
        };
        let (internal, correlation) = extract(&invalid, IngressTrust::Internal);
        assert!(!internal.span().span_context().is_valid());
        assert!(
            internal
                .span()
                .span_context()
                .trace_state()
                .header()
                .is_empty()
        );
        assert!(valid_request_id(&correlation.request_id));
    }
}
