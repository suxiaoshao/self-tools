mod config;
mod proxy;
mod route;

use config::GatewayConfig;
use pingora::prelude::*;
use proxy::GatewayProxy;
use route::build_routes;
use tracing::{event, metadata::LevelFilter, Level};
use tracing_subscriber::{
    fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
};

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
