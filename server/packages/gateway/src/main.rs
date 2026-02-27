#![cfg_attr(windows, allow(clippy::print_stderr))]

#[cfg(not(windows))]
mod config;
#[cfg(not(windows))]
mod proxy;
#[cfg(not(windows))]
mod route;

#[cfg(not(windows))]
use config::GatewayConfig;
#[cfg(not(windows))]
use pingora::prelude::*;
#[cfg(not(windows))]
use proxy::GatewayProxy;
#[cfg(not(windows))]
use route::build_routes;
#[cfg(not(windows))]
use tracing::{Level, event, metadata::LevelFilter};
#[cfg(not(windows))]
use tracing_subscriber::{
    Layer, fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt,
};

#[cfg(not(windows))]
fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();

    let config = GatewayConfig::from_env();
    let routes = build_routes(&config);

    let mut server = Server::new(None)?;
    server.bootstrap();

    let mut service = http_proxy_service(&server.configuration, GatewayProxy::new(routes, &config));
    service.add_tcp(&config.listen_http);
    service.add_tls(&config.listen_https, &config.tls_cert, &config.tls_key)?;
    server.add_service(service);

    event!(
        Level::INFO,
        listen_http = config.listen_http,
        listen_https = config.listen_https,
        tls_cert = config.tls_cert,
        tls_key = config.tls_key,
        "gateway started"
    );

    server.run_forever();
}

#[cfg(windows)]
fn main() {
    eprintln!("gateway is not supported on Windows; build/run on Linux");
}
