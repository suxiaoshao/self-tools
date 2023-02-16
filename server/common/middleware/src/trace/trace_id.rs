use futures::Future;
use futures_util::ready;
use http::{header::HeaderName, HeaderValue, Request, Response};
use pin_project_lite::pin_project;
use rand::{distributions::Alphanumeric, Rng};
use std::pin::Pin;
use std::task::{Context, Poll};
use tower::{Layer, Service};
use tracing::{instrument::Instrumented, Instrument};

#[derive(Clone)]
pub struct TraceIdExt(pub String);

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
        let headers = req.headers_mut();
        let trace_id = headers.get("trace-id");
        let trace_id = match trace_id {
            None => {
                let trace = rand_length(50);
                headers.append(
                    HeaderName::from_static("trace-id"),
                    HeaderValue::from_str(&trace).unwrap(),
                );
                trace
            }
            Some(value) => value.to_str().unwrap().to_string(),
        };
        req.extensions_mut().insert(TraceIdExt(trace_id.clone()));
        let span = tracing::info_span!("request", trace_id);
        let span2 = span.clone();
        ResponseFuture {
            future: span2.in_scope(|| self.inner.call(req)),
            trace_id,
        }
        .instrument(span)
    }
}

pub fn rand_length(len: usize) -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .map(char::from)
        .take(len)
        .collect::<_>()
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
        trace_id: String,
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
        headers.append(
            HeaderName::from_static("trace-id"),
            HeaderValue::from_str(this.trace_id).unwrap(),
        );
        Poll::Ready(Ok(res))
    }
}
