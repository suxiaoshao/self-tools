use crate::trace::RequestTrace;
use async_trait::async_trait;
use pingora::prelude::*;
use service_errors::{PublicCode, PublicError};

use crate::config::GatewayConfig;
use crate::route::Route;

pub struct ProxyContext {
    pub upstream: Option<Route>,
    pub trace: RequestTrace,
    pub local_response_complete: bool,
}

pub struct GatewayProxy {
    health_upstreams: [String; 3],
    routes: Vec<Route>,
    auth_host: String,
    bookmarks_host: String,
    collections_host: String,
    main_host: String,
}

impl GatewayProxy {
    pub fn new(routes: Vec<Route>, config: &GatewayConfig) -> Self {
        Self {
            health_upstreams: [
                config.login_upstream.clone(),
                config.bookmarks_upstream.clone(),
                config.collections_upstream.clone(),
            ],
            routes,
            auth_host: config.auth_host.clone(),
            bookmarks_host: config.bookmarks_host.clone(),
            collections_host: config.collections_host.clone(),
            main_host: config.main_host.clone(),
        }
    }

    fn route_for(&self, host: &str, path: &str) -> Option<Route> {
        if host == self.auth_host
            || ((host == self.bookmarks_host || host == self.collections_host)
                && (path == "/graphql" || path.starts_with("/api/")))
        {
            return None;
        }
        self.routes
            .iter()
            .find(|route| {
                if host == self.main_host
                    && (path == "/api" || path.starts_with("/api/"))
                    && !route.auth_api()
                {
                    return false;
                }
                route.matches(host, path)
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

fn normalize_host(value: &str) -> Option<String> {
    let value = value.trim();
    if value.is_empty() {
        return None;
    }

    let value = value
        .strip_prefix('[')
        .and_then(|value| value.split_once(']').map(|(host, _rest)| host))
        .unwrap_or_else(|| value.split(':').next().unwrap_or_default());
    let value = value.trim();

    if value.is_empty() {
        return None;
    }

    Some(value.to_ascii_lowercase())
}

fn header_to_string(headers: &http::HeaderMap, name: &'static str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn request_host(req: &RequestHeader) -> String {
    req.uri
        .host()
        .map(ToString::to_string)
        .or_else(|| header_to_string(&req.headers, "host"))
        .or_else(|| {
            req.uri
                .authority()
                .map(|authority| authority.as_str().to_string())
        })
        .and_then(|value| normalize_host(&value))
        .unwrap_or_default()
}

#[async_trait]
impl ProxyHttp for GatewayProxy {
    type CTX = ProxyContext;

    fn new_ctx(&self) -> Self::CTX {
        ProxyContext {
            upstream: None,
            trace: RequestTrace::new(),
            local_response_complete: false,
        }
    }

    async fn request_filter(&self, session: &mut Session, ctx: &mut Self::CTX) -> Result<bool> {
        let req = session.req_header();
        let host = request_host(req);
        ctx.trace.method = crate::trace::method(req.method.as_str());

        let path = req.uri.path().to_string();
        if path == "/health/ready" {
            ctx.trace.route = "/health/ready";
            let local = session
                .client_addr()
                .and_then(|a| a.as_inet())
                .is_some_and(|a| a.ip().is_loopback());
            let status = if local {
                let [login, bookmarks, collections] = self.health_upstreams.clone();
                let (a, b, c) = tokio::join!(
                    service_health::http_ready(login),
                    service_health::http_ready(bookmarks),
                    service_health::http_ready(collections)
                );
                if a && b && c { 204 } else { 503 }
            } else {
                404
            };
            let mut header = ResponseHeader::build(status, None)?;
            header.insert_header("Content-Length", "0")?;
            header.insert_header(HEADER_X_REQUEST_ID, &ctx.trace.correlation.request_id)?;
            session
                .write_response_header(Box::new(header), true)
                .await?;
            ctx.local_response_complete = true;
            return Ok(true);
        }

        let path_and_query = req
            .uri
            .path_and_query()
            .map(|value| value.as_str().to_string())
            .unwrap_or_else(|| "/".to_string());
        // Public headers never select an internal trace, request identity or baggage.
        for name in [
            "traceparent",
            "tracestate",
            "trace-id",
            "x-request-id",
            "baggage",
        ] {
            session.req_header_mut().remove_header(name);
        }

        let is_tls = session
            .digest()
            .and_then(|digest| digest.ssl_digest.as_ref())
            .is_some();

        if !is_tls && self.should_redirect_to_https(&host, &path) {
            let location = format!("https://{host}{path_and_query}");
            let mut header = ResponseHeader::build(301, None)?;
            header.insert_header("Location", location)?;
            header.insert_header(HEADER_X_REQUEST_ID, &ctx.trace.correlation.request_id)?;
            session
                .write_response_header(Box::new(header), true)
                .await?;
            return Ok(true);
        }

        match self.route_for(&host, &path) {
            Some(route) => {
                ctx.trace.route = match route.sni.as_str() {
                    "login" => "/api/auth/*",
                    "bookmarks" if route.auth_api() => "/api/bookmarks/graphql",
                    "collections" => "/api/collections/graphql",
                    "bookmarks" => "/fetch-content",
                    "portal" | "collections-web" => "frontend",
                    _ => "other",
                };
                ctx.upstream = Some(route);
                Ok(false)
            }
            None => {
                write_error(session, ctx, PublicCode::NotFound).await?;
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
            ctx.trace.start_upstream();
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
        let host = request_host(session.req_header());

        if !host.is_empty() {
            upstream_request.remove_header("Host");
            upstream_request.insert_header("Host", host)?;
        }

        let api = ctx.upstream.as_ref().is_some_and(Route::auth_api);
        let ceremony = api && ctx.upstream.as_ref().is_some_and(|r| r.sni == "login");
        let cookies =
            middleware::auth_http::forwarded_cookies(&upstream_request.headers, api, ceremony)
                .map_err(|_| Error::explain(ErrorType::HTTPStatus(400), "invalid cookie header"))?;
        upstream_request.remove_header("cookie");
        if !cookies.is_empty() {
            upstream_request.insert_header("cookie", cookies)?;
        }
        if api {
            upstream_request.remove_header("authorization");
        }

        let fields = ctx.trace.outgoing();
        for name in [
            "traceparent",
            "tracestate",
            "trace-id",
            "x-request-id",
            "baggage",
        ] {
            upstream_request.remove_header(name);
        }
        upstream_request.insert_header(HEADER_TRACE_PARENT, fields.traceparent)?;
        upstream_request.insert_header(HEADER_X_REQUEST_ID, fields.request_id)?;
        if let Some(state) = fields.tracestate {
            upstream_request.insert_header("tracestate", state)?;
        }

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
        if ctx.upstream.as_ref().is_some_and(Route::auth_api) {
            upstream_response.insert_header("cache-control", "no-store")?;
        }
        for name in ["traceparent", "tracestate", "trace-id", "baggage"] {
            upstream_response.remove_header(name);
        }
        upstream_response.insert_header(HEADER_X_REQUEST_ID, &ctx.trace.correlation.request_id)?;
        Ok(())
    }

    async fn upstream_response_filter(
        &self,
        _session: &mut Session,
        response: &mut ResponseHeader,
        ctx: &mut Self::CTX,
    ) -> Result<()> {
        ctx.trace.upstream_status = Some(response.status.as_u16());
        Ok(())
    }
    fn upstream_response_body_filter(
        &self,
        _session: &mut Session,
        _body: &mut Option<bytes::Bytes>,
        end_of_stream: bool,
        ctx: &mut Self::CTX,
    ) -> Result<Option<std::time::Duration>> {
        ctx.trace.upstream_eof = end_of_stream;
        Ok(None)
    }
    async fn fail_to_proxy(
        &self,
        session: &mut Session,
        error: &Error,
        ctx: &mut Self::CTX,
    ) -> pingora::proxy::FailToProxy {
        let code = public_code(error);
        // A body that has already begun cannot be replaced with a second HTTP response.
        if session.response_written().is_none() {
            let _ = write_error(session, ctx, code).await;
        }
        pingora::proxy::FailToProxy {
            error_code: code.status(),
            can_reuse_downstream: false,
        }
    }
    fn error_while_proxy(
        &self,
        _peer: &HttpPeer,
        _session: &mut Session,
        mut error: Box<Error>,
        _ctx: &mut Self::CTX,
        _client_reused: bool,
    ) -> Box<Error> {
        // A lost response cannot establish whether a mutation committed.
        error.set_retry(false);
        error
    }
    fn suppress_error_log(&self, _session: &Session, _ctx: &Self::CTX, _error: &Error) -> bool {
        true
    }
    async fn logging(&self, session: &mut Session, error: Option<&Error>, ctx: &mut Self::CTX) {
        let status = session.response_written().map(|r| r.status.as_u16());
        if let Some(error) = error {
            ctx.trace.server.in_scope(||tracing::error!(target:"telemetry",event="fault",operation="gateway_proxy",cause_kind="protocol",cause_code=public_code(error).as_str()));
        }
        ctx.trace.finish(
            status,
            error.is_none() || ctx.local_response_complete,
            error.is_none(),
        );
    }
}
fn public_code(error: &Error) -> PublicCode {
    match error.etype() {
        ErrorType::HTTPStatus(400) => PublicCode::InvalidRequest,
        ErrorType::HTTPStatus(404) => PublicCode::NotFound,
        ErrorType::ConnectTimedout
        | ErrorType::TLSHandshakeTimedout
        | ErrorType::ReadTimedout
        | ErrorType::WriteTimedout => PublicCode::UpstreamTimeout,
        ErrorType::ConnectError | ErrorType::ConnectRefused | ErrorType::ConnectNoRoute => {
            PublicCode::Unavailable
        }
        _ if error.esource() == &pingora::ErrorSource::Downstream => PublicCode::InvalidRequest,
        _ if error.esource() == &pingora::ErrorSource::Upstream => PublicCode::UpstreamFailure,
        _ => PublicCode::Internal,
    }
}
async fn write_error(
    session: &mut Session,
    ctx: &mut ProxyContext,
    code: PublicCode,
) -> Result<()> {
    let public = PublicError::new(code, ctx.trace.correlation.request_id.clone());
    let body = serde_json::to_vec(&serde_json::json!({"error":public}))
        .map_err(|_| Error::new(ErrorType::InternalError))?;
    let mut header = ResponseHeader::build(code.status(), None)?;
    header.insert_header("content-type", "application/json")?;
    header.insert_header("cache-control", "no-store")?;
    header.insert_header(HEADER_X_REQUEST_ID, &ctx.trace.correlation.request_id)?;
    header.insert_header("content-length", body.len().to_string())?;
    let head = session.req_header().method == http::Method::HEAD;
    session
        .write_response_header(Box::new(header), head)
        .await?;
    if !head {
        session.write_response_body(Some(body.into()), true).await?;
    }
    ctx.local_response_complete = true;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{normalize_host, request_host};

    #[test]
    fn main_api_routes_are_exact_and_retired_hosts_do_not_fall_back() {
        let config = crate::config::GatewayConfig::from_env();
        let proxy = super::GatewayProxy::new(crate::route::build_routes(&config), &config);
        for (path, sni) in [
            ("/api/auth/session", "login"),
            ("/api/bookmarks/graphql", "bookmarks"),
            ("/api/collections/graphql", "collections"),
        ] {
            assert_eq!(proxy.route_for(&config.main_host, path).unwrap().sni, sni);
        }
        for path in [
            "/api",
            "/api/unknown",
            "/api/authentic/session",
            "/api/bookmarks/graphql-extra",
        ] {
            assert!(proxy.route_for(&config.main_host, path).is_none());
        }
        assert!(proxy.route_for(&config.auth_host, "/api/login").is_none());
        assert!(
            proxy
                .route_for(&config.bookmarks_host, "/graphql")
                .is_none()
        );
        assert!(
            proxy
                .route_for(&config.collections_host, "/graphql")
                .is_none()
        );
        assert_eq!(
            proxy
                .route_for(&config.main_host, "/settings/security")
                .unwrap()
                .sni,
            "portal"
        );
        assert!(
            proxy
                .route_for(&config.bookmarks_host, "/fetch-content")
                .is_some()
        );
    }

    use pingora::http::RequestHeader;

    #[test]
    fn request_host_prefers_host_header() {
        let mut req = RequestHeader::build("GET", b"/", None).expect("request");
        req.insert_header("host", "sushao.top:443").expect("host");
        assert_eq!(request_host(&req), "sushao.top");
    }

    #[test]
    fn request_host_falls_back_to_uri_authority() {
        let mut req = RequestHeader::build("GET", b"/graphql", None).expect("request");
        req.set_uri(
            "https://collections.sushao.top/graphql"
                .parse()
                .expect("uri"),
        );
        assert_eq!(request_host(&req), "collections.sushao.top");
    }

    #[test]
    fn normalize_host_supports_ipv6_authority() {
        assert_eq!(
            normalize_host("[2001:db8::1]:443"),
            Some("2001:db8::1".to_string())
        );
    }
}
