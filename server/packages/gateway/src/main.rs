#![cfg_attr(windows, allow(clippy::print_stderr))]

#[cfg(not(windows))]
mod config;
#[cfg(not(windows))]
mod proxy;
#[cfg(not(windows))]
mod route;
#[cfg(not(windows))]
mod trace;

#[cfg(not(windows))]
use config::GatewayConfig;
#[cfg(not(windows))]
use pingora::listeners::tls::TlsSettings;
#[cfg(not(windows))]
use pingora::prelude::*;
#[cfg(not(windows))]
use proxy::GatewayProxy;
#[cfg(not(windows))]
use route::build_routes;
#[cfg(not(windows))]
fn main() -> Result<()> {
    let config = GatewayConfig::from_env();
    match service_health::mode(false)
        .map_err(|_| pingora::Error::new(pingora::ErrorType::InternalError))?
    {
        service_health::Mode::Serve => (),
        service_health::Mode::Help => {
            service_health::help(false);
            return Ok(());
        }
        service_health::Mode::CheckReady => {
            service_health::probe_gateway(&config.listen_http, &config.listen_https)
                .map_err(|_| pingora::Error::new(pingora::ErrorType::ConnectError))?;
            return Ok(());
        }
        service_health::Mode::Migrate => unreachable!(),
    }
    let telemetry = telemetry::init("gateway").map_err(|e| {
        pingora::Error::because(
            pingora::ErrorType::InternalError,
            "telemetry initialization failed",
            e,
        )
    })?;
    let result = (|| {
        let routes = build_routes(&config);

        // Containers must reach SDK shutdown without Pingora's five-minute grace delay.
        let mut server = Server::new_with_opt_and_conf(
            None,
            pingora::server::configuration::ServerConf {
                grace_period_seconds: Some(0),
                graceful_shutdown_timeout_seconds: Some(5),
                ..Default::default()
            },
        );
        server.bootstrap();

        let mut service =
            http_proxy_service(&server.configuration, GatewayProxy::new(routes, &config));
        service.add_tcp(&config.listen_http);
        let mut tls_settings = TlsSettings::intermediate(&config.tls_cert, &config.tls_key)?;
        tls_settings.enable_h2();
        service.add_tls_with_settings(&config.listen_https, None, tls_settings);
        server.add_service(service);

        tracing::info!(target:"telemetry",event="service.started");
        server.run(pingora::server::RunArgs::default());
        Ok(())
    })();
    if telemetry.shutdown().is_err() {
        eprintln!("telemetry shutdown incomplete");
    }
    result
}

#[cfg(windows)]
fn main() {
    eprintln!("gateway is not supported on Windows; build/run on Linux");
}
