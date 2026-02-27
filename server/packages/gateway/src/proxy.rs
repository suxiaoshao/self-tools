use async_trait::async_trait;
use pingora::prelude::*;
use tracing::{event, Level};

use crate::config::GatewayConfig;
use crate::route::Route;

#[derive(Clone)]
pub struct ProxyContext {
    pub upstream: Option<Route>,
    pub trace_id: String,
    pub request_id: String,
    pub traceparent: String,
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

const HEADER_TRACE_PARENT: &str = "traceparent";
const HEADER_X_REQUEST_ID: &str = "x-request-id";
const HEADER_TRACE_ID: &str = "trace-id";

fn header_to_string(headers: &http::HeaderMap, name: &'static str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn is_hex(value: &str) -> bool {
    value.as_bytes().iter().all(|b| b.is_ascii_hexdigit())
}

fn is_all_zero(value: &str) -> bool {
    value.bytes().all(|b| b == b'0')
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

fn random_hex(bytes_len: usize) -> String {
    let mut out = String::with_capacity(bytes_len * 2);
    for _ in 0..bytes_len {
        let byte: u8 = rand::random();
        out.push_str(&format!("{byte:02x}"));
    }
    out
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

#[async_trait]
impl ProxyHttp for GatewayProxy {
    type CTX = ProxyContext;

    fn new_ctx(&self) -> Self::CTX {
        ProxyContext {
            upstream: None,
            trace_id: String::new(),
            request_id: String::new(),
            traceparent: String::new(),
        }
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

        let path = req.uri.path().to_string();
        let path_and_query = req
            .uri
            .path_and_query()
            .map(|value| value.as_str().to_string())
            .unwrap_or_else(|| "/".to_string());
        let traceparent = header_to_string(&req.headers, HEADER_TRACE_PARENT)
            .and_then(|value| validate_traceparent(&value))
            .unwrap_or_else(generate_traceparent);
        let trace_id = parse_trace_id_from_traceparent(&traceparent)
            .unwrap_or_else(|| random_hex(16));
        let request_id = header_to_string(&req.headers, HEADER_X_REQUEST_ID)
            .filter(|value| valid_request_id(value))
            .or_else(|| header_to_string(&req.headers, HEADER_TRACE_ID).filter(|value| valid_request_id(value)))
            .unwrap_or_else(|| trace_id.clone());
        ctx.trace_id = trace_id;
        ctx.request_id = request_id;
        ctx.traceparent = traceparent;

        let req_headers = session.req_header_mut();
        req_headers.remove_header(HEADER_TRACE_PARENT);
        req_headers.insert_header(HEADER_TRACE_PARENT, &ctx.traceparent)?;
        req_headers.remove_header(HEADER_X_REQUEST_ID);
        req_headers.insert_header(HEADER_X_REQUEST_ID, &ctx.request_id)?;
        req_headers.remove_header(HEADER_TRACE_ID);
        req_headers.insert_header(HEADER_TRACE_ID, &ctx.request_id)?;

        let is_tls = session
            .digest()
            .and_then(|digest| digest.ssl_digest.as_ref())
            .is_some();

        if !is_tls && self.should_redirect_to_https(&host, &path) {
            let location = format!("https://{host}{path_and_query}");
            let mut header = ResponseHeader::build(301, None)?;
            header.insert_header("Location", location)?;
            session.write_response_header(Box::new(header), true).await?;
            return Ok(true);
        }

        match self.route_for(&host, &path) {
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

    async fn upstream_request_filter(
        &self,
        session: &mut Session,
        upstream_request: &mut RequestHeader,
        ctx: &mut Self::CTX,
    ) -> Result<()>
    where
        Self::CTX: Send + Sync,
    {
        let host = session
            .req_header()
            .headers
            .get("host")
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .split(':')
            .next()
            .unwrap_or_default()
            .to_ascii_lowercase();

        if !host.is_empty() {
            upstream_request.remove_header("Host");
            upstream_request.insert_header("Host", host)?;
        }

        upstream_request.remove_header(HEADER_TRACE_PARENT);
        upstream_request.insert_header(HEADER_TRACE_PARENT, &ctx.traceparent)?;
        upstream_request.remove_header(HEADER_X_REQUEST_ID);
        upstream_request.insert_header(HEADER_X_REQUEST_ID, &ctx.request_id)?;
        upstream_request.remove_header(HEADER_TRACE_ID);
        upstream_request.insert_header(HEADER_TRACE_ID, &ctx.request_id)?;

        if let Some(client_ip) = session
            .client_addr()
            .and_then(|addr| addr.as_inet().map(|inet| inet.ip().to_string()))
        {
            upstream_request.remove_header("X-Real-IP");
            upstream_request.insert_header("X-Real-IP", client_ip.clone())?;

            let xff = upstream_request
                .headers
                .get("X-Forwarded-For")
                .and_then(|value| value.to_str().ok())
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(|value| format!("{value}, {client_ip}"))
                .unwrap_or(client_ip);
            upstream_request.remove_header("X-Forwarded-For");
            upstream_request.insert_header("X-Forwarded-For", xff)?;
        }

        Ok(())
    }

    async fn response_filter(
        &self,
        _session: &mut Session,
        upstream_response: &mut ResponseHeader,
        ctx: &mut Self::CTX,
    ) -> Result<()>
    where
        Self::CTX: Send + Sync,
    {
        upstream_response.remove_header(HEADER_TRACE_PARENT);
        upstream_response.insert_header(HEADER_TRACE_PARENT, &ctx.traceparent)?;
        upstream_response.remove_header(HEADER_X_REQUEST_ID);
        upstream_response.insert_header(HEADER_X_REQUEST_ID, &ctx.request_id)?;
        upstream_response.remove_header(HEADER_TRACE_ID);
        upstream_response.insert_header(HEADER_TRACE_ID, &ctx.request_id)?;
        Ok(())
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
                    trace_id = ctx.trace_id,
                    request_id = ctx.request_id,
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
                    trace_id = ctx.trace_id,
                    request_id = ctx.request_id,
                    "gateway request"
                );
            }
        }
    }
}
