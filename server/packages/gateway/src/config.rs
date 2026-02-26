use std::env;

pub struct GatewayConfig {
    pub auth_host: String,
    pub bookmarks_host: String,
    pub collections_host: String,
    pub main_host: String,
    pub login_upstream: String,
    pub bookmarks_upstream: String,
    pub collections_upstream: String,
    pub bookmarks_web_upstream: String,
    pub collections_web_upstream: String,
    pub main_web_upstream: String,
    pub listen_http: String,
    pub listen_https: String,
    pub tls_cert: String,
    pub tls_key: String,
}

impl GatewayConfig {
    pub fn from_env() -> Self {
        Self {
            auth_host: env_or("GATEWAY_AUTH_HOST", "auth.sushao.top"),
            bookmarks_host: env_or("GATEWAY_BOOKMARKS_HOST", "bookmarks.sushao.top"),
            collections_host: env_or("GATEWAY_COLLECTIONS_HOST", "collections.sushao.top"),
            main_host: env_or("GATEWAY_MAIN_HOST", "sushao.top"),
            login_upstream: env_or("GATEWAY_LOGIN_UPSTREAM", "login:8000"),
            bookmarks_upstream: env_or("GATEWAY_BOOKMARKS_UPSTREAM", "bookmarks:8080"),
            collections_upstream: env_or("GATEWAY_COLLECTIONS_UPSTREAM", "collections:8080"),
            bookmarks_web_upstream: env_or(
                "GATEWAY_BOOKMARKS_WEB_UPSTREAM",
                "host.docker.internal:3002",
            ),
            collections_web_upstream: env_or(
                "GATEWAY_COLLECTIONS_WEB_UPSTREAM",
                "host.docker.internal:3001",
            ),
            main_web_upstream: env_or("GATEWAY_MAIN_WEB_UPSTREAM", "host.docker.internal:3000"),
            listen_http: env_or("GATEWAY_LISTEN_HTTP", "0.0.0.0:80"),
            listen_https: env_or("GATEWAY_LISTEN_HTTPS", "0.0.0.0:443"),
            tls_cert: env_or(
                "GATEWAY_TLS_CERT",
                "/etc/letsencrypt/live/sushao.top-0006/fullchain.pem",
            ),
            tls_key: env_or(
                "GATEWAY_TLS_KEY",
                "/etc/letsencrypt/live/sushao.top-0006/privkey.pem",
            ),
        }
    }
}

fn env_or(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}
