use std::task::{Context, Poll};

use futures::future::BoxFuture;
use http::{header::HeaderName, HeaderValue, Request, Response};
use rand::{distributions::Alphanumeric, Rng};
use tower::{Layer, Service};
use tracing::Instrument;

pub struct Tracing<S> {
    inner: S,
}

impl<S> Clone for Tracing<S>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl<T> Tracing<T> {
    pub fn new(inner: T) -> Self {
        Self { inner }
    }
}

impl<B, S, RES> Service<Request<B>> for Tracing<S>
where
    S: Service<Request<B>> + Send + 'static,
    B: 'static,
    S::Future: Send + 'static,
    S: Service<Request<B>, Response = Response<RES>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, mut req: Request<B>) -> Self::Future {
        let headers = req.headers_mut();
        let trace_id = headers.get("trace_id");
        let trace_id = match trace_id {
            None => {
                let trace = rand_length(50);
                headers.append(
                    HeaderName::from_static("trace_id"),
                    HeaderValue::from_str(&trace).unwrap(),
                );
                trace
            }
            Some(value) => value.to_str().unwrap().to_string(),
        };
        req.extensions_mut().insert(trace_id.clone());
        let fut = self.inner.call(req);
        Box::pin(async move {
            // `inner` might not be ready since its a clone
            let res = fut
                .instrument(tracing::info_span!("request", trace_id))
                .await;
            // todo: add trace_id to response
            res
        })
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
pub struct TraceLayer;

impl<S> Layer<S> for TraceLayer {
    type Service = Tracing<S>;

    fn layer(&self, inner: S) -> Tracing<S> {
        Tracing::new(inner)
    }
}
