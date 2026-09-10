use crate::config::GatewayConfig;
#[derive(Clone)]
pub struct Route {
    pub host: String,
    pub path_prefix: Option<String>,
    pub upstream: String,
    pub tls: bool,
    pub sni: String,
}
impl Route {
    pub fn matches(&self, host: &str, path: &str) -> bool {
        self.host == host
            && self.path_prefix.as_ref().is_none_or(|p| {
                if p.ends_with('/') {
                    path.starts_with(p)
                } else {
                    path == p
                }
            })
    }
    pub fn auth_api(&self) -> bool {
        self.path_prefix
            .as_ref()
            .is_some_and(|p| p.starts_with("/api/"))
    }
}
pub fn build_routes(config: &GatewayConfig) -> Vec<Route> {
    let route = |host: &String, path: Option<&str>, upstream: &String, sni: &str| Route {
        host: host.clone(),
        path_prefix: path.map(Into::into),
        upstream: upstream.clone(),
        tls: false,
        sni: sni.into(),
    };
    vec![
        route(
            &config.main_host,
            Some("/api/auth/"),
            &config.login_upstream,
            "login",
        ),
        route(
            &config.main_host,
            Some("/api/bookmarks/graphql"),
            &config.bookmarks_upstream,
            "bookmarks",
        ),
        route(
            &config.main_host,
            Some("/api/collections/graphql"),
            &config.collections_upstream,
            "collections",
        ),
        route(
            &config.main_host,
            Some("/fetch-content"),
            &config.bookmarks_upstream,
            "bookmarks",
        ),
        route(
            &config.bookmarks_host,
            None,
            &config.bookmarks_upstream,
            "bookmarks",
        ),
        route(
            &config.collections_host,
            None,
            &config.collections_web_upstream,
            "collections-web",
        ),
        route(&config.main_host, None, &config.main_web_upstream, "portal"),
    ]
}
