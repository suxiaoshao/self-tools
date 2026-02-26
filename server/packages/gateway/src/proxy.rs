use async_trait::async_trait;
use pingora::prelude::*;
use tracing::{event, Level};

use crate::route::Route;

#[derive(Clone)]
pub struct ProxyContext {
    pub upstream: Option<Route>,
}

pub struct GatewayProxy {
    routes: Vec<Route>,
}

impl GatewayProxy {
    pub fn new(routes: Vec<Route>) -> Self {
        Self { routes }
    }

    fn route_for(&self, host: &str, path: &str) -> Option<Route> {
        self.routes
            .iter()
            .find(|route| {
                if route.host != host {
                    return false;
                }

                route
                    .path_prefix
                    .as_ref()
                    .map(|prefix| path.starts_with(prefix))
                    .unwrap_or(true)
            })
            .cloned()
    }
}

#[async_trait]
impl ProxyHttp for GatewayProxy {
    type CTX = ProxyContext;

    fn new_ctx(&self) -> Self::CTX {
        ProxyContext { upstream: None }
    }

    async fn request_filter(&self, session: &mut Session, ctx: &mut Self::CTX) -> Result<bool> {
        let req = session.req_header();
        let host = req
            .headers
            .get("host")
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .split(':')
            .next()
            .unwrap_or_default()
            .to_ascii_lowercase();

        let path = req.uri.path();

        match self.route_for(&host, path) {
            Some(route) => {
                ctx.upstream = Some(route);
                Ok(false)
            }
            None => {
                event!(Level::WARN, host, path, "no route matched");
                session.respond_error(404).await?;
                Ok(true)
            }
        }
    }

    async fn upstream_peer(
        &self,
        _session: &mut Session,
        ctx: &mut Self::CTX,
    ) -> Result<Box<HttpPeer>> {
        if let Some(route) = &ctx.upstream {
            return Ok(Box::new(HttpPeer::new(
                route.upstream.clone(),
                route.tls,
                route.sni.clone(),
            )));
        }

        Err(Error::explain(
            ErrorType::HTTPStatus(500),
            "upstream route is missing",
        ))
    }
}
