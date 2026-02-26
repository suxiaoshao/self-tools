use async_trait::async_trait;
use pingora::prelude::*;
use tracing::{event, Level};

use crate::config::GatewayConfig;
use crate::route::Route;

#[derive(Clone)]
pub struct ProxyContext {
    pub upstream: Option<Route>,
}

pub struct GatewayProxy {
    routes: Vec<Route>,
    auth_host: String,
    bookmarks_host: String,
    collections_host: String,
    main_host: String,
}

impl GatewayProxy {
    pub fn new(routes: Vec<Route>, config: &GatewayConfig) -> Self {
        Self {
            routes,
            auth_host: config.auth_host.clone(),
            bookmarks_host: config.bookmarks_host.clone(),
            collections_host: config.collections_host.clone(),
            main_host: config.main_host.clone(),
        }
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

    fn should_redirect_to_https(&self, host: &str, path: &str) -> bool {
        if host == self.auth_host {
            return path.starts_with("/api");
        }

        host == self.bookmarks_host || host == self.collections_host || host == self.main_host
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
        let is_tls = session
            .digest()
            .and_then(|digest| digest.ssl_digest.as_ref())
            .is_some();

        if !is_tls && self.should_redirect_to_https(&host, path) {
            let path_and_query = req
                .uri
                .path_and_query()
                .map(|value| value.as_str())
                .unwrap_or("/");
            let location = format!("https://{host}{path_and_query}");
            let mut header = ResponseHeader::build(301, None)?;
            header.insert_header("Location", location)?;
            session.write_response_header(Box::new(header), true).await?;
            return Ok(true);
        }

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

    async fn logging(&self, session: &mut Session, e: Option<&Error>, ctx: &mut Self::CTX)
    where
        Self::CTX: Send + Sync,
    {
        let req = session.req_header();
        let method = req.method.as_str();
        let host = req
            .headers
            .get("host")
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .split(':')
            .next()
            .unwrap_or_default()
            .to_ascii_lowercase();
        let path = req
            .uri
            .path_and_query()
            .map(|value| value.as_str())
            .unwrap_or("/");
        let status = session
            .response_written()
            .map(|resp| resp.status.as_u16())
            .unwrap_or(0);
        let upstream = ctx
            .upstream
            .as_ref()
            .map(|route| route.upstream.as_str())
            .unwrap_or("-");

        match e {
            Some(error) => {
                event!(
                    Level::ERROR,
                    method,
                    host,
                    path,
                    status,
                    upstream,
                    error = %error,
                    "gateway request finished with error"
                );
            }
            None => {
                event!(
                    Level::INFO,
                    method,
                    host,
                    path,
                    status,
                    upstream,
                    "gateway request"
                );
            }
        }
    }
}
