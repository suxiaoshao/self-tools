use http::{Request, Response};
use http_body::{Body, Frame, SizeHint};
use pin_project_lite::pin_project;
use std::{
    future::Future,
    pin::Pin,
    task::{Context, Poll},
    time::Instant,
};
pub use telemetry::RequestCorrelation;
use telemetry::{IngressTrust, OpenTelemetrySpanExt, PropagationFields};
use tower::{Layer, Service};
use tracing::Instrument;

#[derive(Clone, Copy)]
pub struct TraceLayer;
pub fn trace_layer() -> TraceLayer {
    TraceLayer
}
impl<S> Layer<S> for TraceLayer {
    type Service = TraceService<S>;
    fn layer(&self, inner: S) -> Self::Service {
        TraceService { inner }
    }
}
#[derive(Clone)]
pub struct TraceService<S> {
    inner: S,
}
impl<B, S, R> Service<Request<B>> for TraceService<S>
where
    S: Service<Request<B>, Response = Response<R>>,
    S::Future: Send + 'static,
    S::Error: 'static,
    R: Body + 'static,
{
    type Response = Response<TraceBody<R>>;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;
    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }
    fn call(&mut self, mut request: Request<B>) -> Self::Future {
        let header = |name| {
            request
                .headers()
                .get(name)
                .and_then(|value| value.to_str().ok())
                .unwrap_or_default()
                .to_owned()
        };
        let fields = PropagationFields {
            traceparent: header("traceparent"),
            tracestate: Some(header("tracestate")),
            request_id: header("x-request-id"),
        };
        let (context, correlation) = telemetry::extract(&fields, IngressTrust::Internal);
        let route = request
            .extensions()
            .get::<axum::extract::MatchedPath>()
            .map(|path| path.as_str().to_owned())
            .unwrap_or_else(|| "other".into());
        let method = match request.method().as_str() {
            "GET" => "GET",
            "POST" => "POST",
            "PUT" => "PUT",
            "PATCH" => "PATCH",
            "DELETE" => "DELETE",
            "HEAD" => "HEAD",
            "OPTIONS" => "OPTIONS",
            _ => "other",
        };
        request.extensions_mut().insert(correlation.clone());
        let span = tracing::info_span!(target: "telemetry", "http.server", otel.kind = "server");
        let _ = span.set_parent(context);
        let guard = Completion {
            span: span.clone(),
            started: Instant::now(),
            method,
            route,
            status: None,
            done: false,
        };
        let future = span.in_scope(|| self.inner.call(request));
        Box::pin(
            async move {
                let mut guard = guard;
                let response = future.await?;
                let (mut parts, body) = response.into_parts();
                // Only the public correlation identifier is returned to the browser.
                for name in ["traceparent", "tracestate", "trace-id", "baggage"] {
                    parts.headers.remove(name);
                }
                if let Ok(value) = correlation.request_id.parse() {
                    parts.headers.insert("x-request-id", value);
                }
                guard.status = Some(parts.status.as_u16());
                if body.is_end_stream() {
                    guard.complete();
                }
                Ok(Response::from_parts(
                    parts,
                    TraceBody { inner: body, guard },
                ))
            }
            .instrument(span),
        )
    }
}

struct Completion {
    span: tracing::Span,
    started: Instant,
    method: &'static str,
    route: String,
    status: Option<u16>,
    done: bool,
}
impl Completion {
    fn complete(&mut self) {
        if self.done {
            return;
        }
        self.done = true;
        let outcome = if self.status.is_some_and(|s| s >= 500) {
            "fault"
        } else if self.status.is_some_and(|s| s >= 400) {
            "rejected"
        } else {
            "success"
        };
        self.span.in_scope(|| {
            tracing::info!(target: "telemetry", event = "http.completed", method = self.method,
            route = self.route.as_str(), status = self.status.unwrap_or(0) as u64,
            duration_ms = self.started.elapsed().as_millis() as u64, outcome)
        });
    }
}
impl Completion {
    fn interrupt(&mut self) {
        if self.done {
            return;
        }
        self.done = true;
        self.span.in_scope(|| {
            if let Some(status) = self.status {
                tracing::warn!(target: "telemetry", event = "http.interrupted", method = self.method,
                    route = self.route.as_str(), status = status as u64, duration_ms = self.started.elapsed().as_millis() as u64, stage = "body");
            } else {
                tracing::warn!(target: "telemetry", event = "http.interrupted", method = self.method,
                    route = self.route.as_str(), duration_ms = self.started.elapsed().as_millis() as u64, stage = "headers");
            }
        });
    }
}
impl Drop for Completion {
    fn drop(&mut self) {
        self.interrupt();
    }
}
pin_project! {
    pub struct TraceBody<B> { #[pin] inner: B, guard: Completion }
}
impl<B: Body> Body for TraceBody<B> {
    type Data = B::Data;
    type Error = B::Error;
    fn poll_frame(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Result<Frame<Self::Data>, Self::Error>>> {
        let mut this = self.project();
        let result = this
            .guard
            .span
            .in_scope(|| this.inner.as_mut().poll_frame(cx));
        match &result {
            Poll::Ready(None) => this.guard.complete(),
            Poll::Ready(Some(Err(_))) => this.guard.interrupt(),
            Poll::Ready(Some(Ok(_))) if this.inner.is_end_stream() => this.guard.complete(),
            _ => {}
        }
        result
    }
    fn is_end_stream(&self) -> bool {
        self.inner.is_end_stream()
    }
    fn size_hint(&self) -> SizeHint {
        self.inner.size_hint()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{Body as AxumBody, to_bytes};
    use std::sync::{Arc, Mutex};
    use tower::{ServiceBuilder, ServiceExt, service_fn};
    use tracing::{
        Subscriber,
        field::{Field, Visit},
        instrument::WithSubscriber,
    };
    use tracing_subscriber::{layer::Context as LayerContext, prelude::*};

    #[derive(Clone)]
    struct Events(Arc<Mutex<Vec<Vec<String>>>>);
    impl<S: Subscriber> tracing_subscriber::Layer<S> for Events {
        fn on_event(&self, event: &tracing::Event<'_>, _: LayerContext<'_, S>) {
            struct Fields(Vec<String>);
            impl Visit for Fields {
                fn record_str(&mut self, _: &Field, value: &str) {
                    self.0.push(value.into());
                }
                fn record_debug(&mut self, _: &Field, _: &dyn std::fmt::Debug) {}
            }
            let mut fields = Fields(Vec::new());
            event.record(&mut fields);
            self.0.lock().unwrap().push(fields.0);
        }
    }
    #[tokio::test]
    async fn completion_covers_eof_future_cancellation_and_body_drop_without_payloads() {
        let events = Events(Arc::new(Mutex::new(Vec::new())));
        let subscriber = tracing_subscriber::registry().with(events.clone());
        async {
            let service = ServiceBuilder::new()
                .layer(trace_layer())
                .service(service_fn(|_: Request<AxumBody>| async {
                    Ok::<_, std::convert::Infallible>(Response::new(AxumBody::from(
                        "private response",
                    )))
                }));
            let response = service
                .oneshot(
                    Request::builder()
                        .uri("/secret?token=password")
                        .header("cookie", "secret")
                        .body(AxumBody::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.headers()["x-request-id"].len(), 32);
            assert!(!response.headers().contains_key("traceparent"));
            to_bytes(AxumBody::new(response.into_body()), 1024)
                .await
                .unwrap();

            let failing = ServiceBuilder::new()
                .layer(trace_layer())
                .service(service_fn(|_: Request<AxumBody>| async {
                    Ok::<_, std::convert::Infallible>(Response::new(AxumBody::from_stream(
                        futures::stream::once(async {
                            Err::<axum::body::Bytes, _>(std::io::Error::other(
                                "secret body failure",
                            ))
                        }),
                    )))
                }));
            let response = failing
                .oneshot(Request::new(AxumBody::empty()))
                .await
                .unwrap();
            assert!(
                to_bytes(AxumBody::new(response.into_body()), 1024)
                    .await
                    .is_err()
            );
            // The same completion guard is used by both RPC adapters; an abandoned
            // future must report interruption, and a classified response only once.
            drop(telemetry::RpcCompletion::new(
                tracing::info_span!("rpc"),
                "Check",
            ));
            let mut rpc = telemetry::RpcCompletion::new(tracing::info_span!("rpc"), "Check");
            rpc.finish("fault", Some("INTERNAL"));
            rpc.finish("fault", Some("INTERNAL"));
            drop(rpc);

            let pending =
                ServiceBuilder::new()
                    .layer(trace_layer())
                    .service(service_fn(|_: Request<AxumBody>| {
                        futures::future::pending::<
                            Result<Response<AxumBody>, std::convert::Infallible>,
                        >()
                    }));
            {
                let future = pending.oneshot(Request::new(AxumBody::empty()));
                futures::pin_mut!(future);
                assert!(futures::poll!(future).is_pending());
            }
            let streaming = ServiceBuilder::new()
                .layer(trace_layer())
                .service(service_fn(|_: Request<AxumBody>| async {
                    Ok::<_, std::convert::Infallible>(Response::new(AxumBody::from_stream(
                        futures::stream::pending::<Result<axum::body::Bytes, std::io::Error>>(),
                    )))
                }));
            drop(
                streaming
                    .oneshot(Request::new(AxumBody::empty()))
                    .await
                    .unwrap(),
            );
        }
        .with_subscriber(subscriber)
        .await;
        let events = events.0.lock().unwrap();
        assert_eq!(
            events
                .iter()
                .filter(|e| e.iter().any(|v| v == "http.completed"))
                .count(),
            1
        );
        assert_eq!(
            events
                .iter()
                .filter(|e| e.iter().any(|v| v == "http.interrupted"))
                .count(),
            3
        );
        for name in ["rpc.completed", "rpc.interrupted"] {
            assert_eq!(
                events
                    .iter()
                    .filter(|event| event.iter().any(|v| v == name))
                    .count(),
                1
            );
        }
        assert!(events.iter().any(|e| e.iter().any(|v| v == "headers")));
        assert!(events.iter().any(|e| e.iter().any(|v| v == "body")));
        assert!(!format!("{events:?}").contains("secret"));
    }
}

/// HTTP owners stop accepting requests and drain response bodies before SDK shutdown.
pub async fn shutdown_signal() {
    #[cfg(unix)]
    {
        let Ok(mut terminate) =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        else {
            tracing::error!(target:"telemetry",event="service.shutdown",code="SIGNAL_SETUP_FAILED");
            return;
        };
        tokio::select! {_=tokio::signal::ctrl_c()=>{},_=terminate.recv()=>{}}
    }
    #[cfg(not(unix))]
    {
        let _ = tokio::signal::ctrl_c().await;
    }
}
