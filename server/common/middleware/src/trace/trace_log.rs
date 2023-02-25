use futures::Future;
use futures_util::ready;
use http::{Request, Response};
use pin_project_lite::pin_project;
use std::pin::Pin;
use std::task::{Context, Poll};
use tower::{Layer, Service};
use tracing::{event, Level};

pub struct TraceLog<S> {
    inner: S,
}

impl<S> Clone for TraceLog<S>
where
    S: Clone,
{
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl<T> TraceLog<T> {
    pub fn new(inner: T) -> Self {
        Self { inner }
    }
}

impl<B, S, RES> Service<Request<B>> for TraceLog<S>
where
    S: Service<Request<B>> + Send + 'static,
    B: 'static,
    S::Future: Send + 'static,
    S: Service<Request<B>, Response = Response<RES>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = ResponseFuture<S::Future>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<B>) -> Self::Future {
        event!(Level::INFO, "Request started");
        let req_header = format!("{:#?}", req.headers());
        let method = req.method().to_string();
        let url = req.uri().to_string();
        event!(
            Level::INFO,
            "request method: {},request url: {}, request header: {}",
            method,
            url,
            req_header,
        );
        ResponseFuture {
            future: self.inner.call(req),
        }
    }
}

#[derive(Clone, Copy)]
pub struct TraceLogLayer;

impl<S> Layer<S> for TraceLogLayer {
    type Service = TraceLog<S>;

    fn layer(&self, inner: S) -> TraceLog<S> {
        TraceLog::new(inner)
    }
}

pin_project! {
    /// Response future for [`SetResponseHeader`].
    #[derive(Debug)]
    pub struct ResponseFuture<F> {
        #[pin]
        future: F,
    }
}

impl<F, ResBody, E> Future for ResponseFuture<F>
where
    F: Future<Output = Result<Response<ResBody>, E>>,
{
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = self.project();
        let res = ready!(this.future.poll(cx)?);
        let res_header = format!("{:#?}", res.headers());
        let status = res.status().to_string();
        event!(
            Level::INFO,
            "response status: {}, response header: {}",
            status,
            res_header,
        );
        event!(Level::INFO, "Request completed");
        Poll::Ready(Ok(res))
    }
}
