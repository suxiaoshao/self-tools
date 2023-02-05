use futures::future::BoxFuture;
use http::{Request, Response};
use std::{
    error::Error,
    task::{Context, Poll},
};

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
    S::Error: Error,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request<B>) -> Self::Future {
        let req_header = format!("{:#?}", req.headers());
        let method = req.method().to_string();
        let url = req.uri().to_string();
        let fut = self.inner.call(req);
        Box::pin(async move {
            // `inner` might not be ready since its a clone
            let res = fut.await;
            match res.as_ref() {
                Ok(res) => {
                    let res_header = format!("{:#?}", res.headers());
                    let status = res.status().to_string();
                    event!(
                        Level::INFO,
                        "request method: {}, response status: {},request url: {}, request header: {}, response header: {}",
                        method,
                        status,
                        url,
                        req_header,
                        res_header,
                    );
                }
                Err(err) => {
                    let message = err.to_string();
                    event!(Level::WARN, message, "Error in request");
                }
            }
            res
        })
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
