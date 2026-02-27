use crate::config::GatewayConfig;

#[derive(Clone)]
pub struct Route {
    pub host: String,
    pub path_prefix: Option<String>,
    pub upstream: String,
    pub tls: bool,
    pub sni: String,
}

pub fn build_routes(config: &GatewayConfig) -> Vec<Route> {
    vec![
        Route {
            host: config.auth_host.clone(),
            path_prefix: Some("/api".to_string()),
            upstream: config.login_upstream.clone(),
            tls: false,
            sni: "login".to_string(),
        },
        Route {
            host: config.bookmarks_host.clone(),
            path_prefix: None,
            upstream: config.bookmarks_upstream.clone(),
            tls: false,
            sni: "bookmarks".to_string(),
        },
        Route {
            host: config.collections_host.clone(),
            path_prefix: Some("/graphql".to_string()),
            upstream: config.collections_upstream.clone(),
            tls: false,
            sni: "collections".to_string(),
        },
        Route {
            host: config.collections_host.clone(),
            path_prefix: None,
            upstream: config.collections_web_upstream.clone(),
            tls: false,
            sni: "collections-web".to_string(),
        },
        Route {
            host: config.main_host.clone(),
            path_prefix: None,
            upstream: config.main_web_upstream.clone(),
            tls: false,
            sni: "portal".to_string(),
        },
    ]
}
