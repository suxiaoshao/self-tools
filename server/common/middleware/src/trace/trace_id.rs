use futures::Future;
use futures_util::ready;
use http::{HeaderValue, Request, Response, header::HeaderName};
use pin_project_lite::pin_project;
use std::pin::Pin;
use std::task::{Context, Poll};
use tower::{Layer, Service};
use tracing::{Instrument, Level, event, instrument::Instrumented};

#[derive(Clone)]
pub struct TraceIdExt(pub String);

const HEADER_TRACE_PARENT: &str = "traceparent";
const HEADER_X_REQUEST_ID: &str = "x-request-id";
const HEADER_TRACE_ID: &str = "trace-id";

#[derive(Clone, Debug)]
struct TraceContext {
    trace_id: String,
    request_id: String,
    traceparent: String,
}

pub struct TraceId<S> {
    inner: S,
}

impl<S> Clone for TraceId<S>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl<T> TraceId<T> {
    pub fn new(inner: T) -> Self {
        Self { inner }
    }
}

impl<B, S, RES> Service<Request<B>> for TraceId<S>
where
    S: Service<Request<B>> + Send,
    S::Future: 'static,
    S: Service<Request<B>, Response = Response<RES>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Instrumented<ResponseFuture<S::Future>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, mut req: Request<B>) -> Self::Future {
        let trace_ctx = resolve_trace_context(req.headers());
        let headers = req.headers_mut();
        upsert_header(headers, HEADER_TRACE_PARENT, &trace_ctx.traceparent);
        upsert_header(headers, HEADER_X_REQUEST_ID, &trace_ctx.request_id);
        // Backward compatibility for existing services that still read `trace-id`.
        upsert_header(headers, HEADER_TRACE_ID, &trace_ctx.request_id);

        req.extensions_mut()
            .insert(TraceIdExt(trace_ctx.trace_id.clone()));
        let span = tracing::info_span!(
            "request",
            trace_id = %trace_ctx.trace_id,
            request_id = %trace_ctx.request_id
        );
        let span2 = span.clone();
        ResponseFuture {
            future: span2.in_scope(|| self.inner.call(req)),
            trace_ctx,
        }
        .instrument(span)
    }
}

fn upsert_header(headers: &mut http::HeaderMap, key: &'static str, value: &str) {
    let Ok(header_name) = HeaderName::from_lowercase(key.as_bytes()) else {
        event!(Level::ERROR, key, "invalid header name");
        return;
    };
    let Ok(header_value) = HeaderValue::from_str(value) else {
        event!(Level::ERROR, key, value, "invalid header value");
        return;
    };
    headers.remove(&header_name);
    headers.insert(header_name, header_value);
}

fn resolve_trace_context(headers: &http::HeaderMap) -> TraceContext {
    let traceparent = header_to_string(headers, HEADER_TRACE_PARENT)
        .and_then(|value| validate_traceparent(&value))
        .unwrap_or_else(generate_traceparent);
    let trace_id = parse_trace_id_from_traceparent(&traceparent).unwrap_or_else(|| random_hex(16));

    let request_id = header_to_string(headers, HEADER_X_REQUEST_ID)
        .filter(|value| valid_request_id(value))
        .or_else(|| {
            header_to_string(headers, HEADER_TRACE_ID).filter(|value| valid_request_id(value))
        })
        .unwrap_or_else(|| trace_id.clone());

    TraceContext {
        trace_id,
        request_id,
        traceparent,
    }
}

fn header_to_string(headers: &http::HeaderMap, name: &'static str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn validate_traceparent(value: &str) -> Option<String> {
    let mut parts = value.split('-');
    let version = parts.next()?;
    let trace_id = parts.next()?;
    let parent_id = parts.next()?;
    let flags = parts.next()?;
    if parts.next().is_some() {
        return None;
    }

    if version.len() != 2
        || trace_id.len() != 32
        || parent_id.len() != 16
        || flags.len() != 2
        || version.eq_ignore_ascii_case("ff")
        || !is_hex(version)
        || !is_hex(trace_id)
        || !is_hex(parent_id)
        || !is_hex(flags)
        || is_all_zero(trace_id)
        || is_all_zero(parent_id)
    {
        return None;
    }

    Some(format!(
        "{}-{}-{}-{}",
        version.to_ascii_lowercase(),
        trace_id.to_ascii_lowercase(),
        parent_id.to_ascii_lowercase(),
        flags.to_ascii_lowercase()
    ))
}

fn parse_trace_id_from_traceparent(traceparent: &str) -> Option<String> {
    let mut parts = traceparent.split('-');
    let _version = parts.next()?;
    let trace_id = parts.next()?;
    Some(trace_id.to_string())
}

fn generate_traceparent() -> String {
    let trace_id = random_hex(16);
    let parent_id = random_hex(8);
    format!("00-{trace_id}-{parent_id}-01")
}

fn valid_request_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value
            .as_bytes()
            .iter()
            .all(|c| c.is_ascii_alphanumeric() || b"-_.:/".contains(c))
}

fn is_hex(value: &str) -> bool {
    value.as_bytes().iter().all(|b| b.is_ascii_hexdigit())
}

fn is_all_zero(value: &str) -> bool {
    value.bytes().all(|b| b == b'0')
}

fn random_hex(bytes_len: usize) -> String {
    let mut out = String::with_capacity(bytes_len * 2);
    for _ in 0..bytes_len {
        let byte: u8 = rand::random();
        out.push_str(&format!("{byte:02x}"));
    }
    out
}

#[derive(Clone, Copy)]
pub struct TraceIdLayer;

impl<S> Layer<S> for TraceIdLayer {
    type Service = TraceId<S>;

    fn layer(&self, inner: S) -> TraceId<S> {
        TraceId::new(inner)
    }
}

pin_project! {
    /// Response future for [`SetResponseHeader`].
    #[derive(Debug)]
    pub struct ResponseFuture<F> {
        #[pin]
        future: F,
        trace_ctx: TraceContext,
    }
}

impl<F, ResBody, E> Future for ResponseFuture<F>
where
    F: Future<Output = Result<Response<ResBody>, E>>,
{
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        let mut res = ready!(this.future.poll(cx)?);
        let headers = res.headers_mut();
        upsert_header(headers, HEADER_TRACE_PARENT, &this.trace_ctx.traceparent);
        upsert_header(headers, HEADER_X_REQUEST_ID, &this.trace_ctx.request_id);
        // Backward compatibility for existing clients still reading `trace-id`.
        upsert_header(headers, HEADER_TRACE_ID, &this.trace_ctx.request_id);
        Poll::Ready(Ok(res))
    }
}
