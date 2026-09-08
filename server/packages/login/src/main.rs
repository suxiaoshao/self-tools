/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 01:30:22
 * @FilePath: /self-tools/server/packages/login/src/main.rs
 */
use crate::router::get_router;
use ::middleware::trace_layer;
use anyhow::Result;
use std::net::SocketAddr;
use tokio::net::TcpListener;
pub mod errors;
mod router;

#[tokio::main]
async fn main() -> Result<()> {
    match service_health::mode(false)? {
        service_health::Mode::Help => {
            service_health::help(false);
            return Ok(());
        }
        service_health::Mode::CheckReady => {
            return service_health::probe_http("127.0.0.1:8000").await;
        }
        service_health::Mode::Migrate => unreachable!(),
        service_health::Mode::Serve => (),
    }
    let telemetry = telemetry::init("login")?;
    let result: anyhow::Result<()> = async {
        // 获取路由
        let app = get_router()?.layer(trace_layer());

        // run our app with hyper
        // `axum::Server` is a re-export of `hyper::Server`
        let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
        let listener = TcpListener::bind(addr).await?;

        tracing::info!(target: "telemetry", event = "service.started");
        axum::serve(listener, app)
            .with_graceful_shutdown(middleware::shutdown_signal())
            .await?;
        Ok(())
    }
    .await;
    let shutdown = tokio::task::spawn_blocking(move || telemetry.shutdown()).await;
    if !matches!(shutdown, Ok(Ok(()))) {
        eprintln!("telemetry shutdown incomplete");
    }
    result
}
