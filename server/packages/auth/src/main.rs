/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-17 00:00:32
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-19 02:06:30
 * @FilePath: /self-tools/server/packages/new_auth/src/main.rs
 */
use anyhow::anyhow;
use std::net::SocketAddr;

use service::AuthImpl;

mod application;
mod domain;
mod error;
const MIGRATIONS: diesel_migrations::EmbeddedMigrations =
    diesel_migrations::embed_migrations!("migrations");
mod passkey;
mod repository;
mod service;
mod session;

#[volo::main]
async fn main() -> anyhow::Result<()> {
    match service_health::mode(true)? {
        service_health::Mode::Help => {
            service_health::help(true);
            return Ok(());
        }
        service_health::Mode::CheckReady => {
            anyhow::ensure!(
                service_health::local_auth_ready().await,
                "auth is not ready"
            );
            return Ok(());
        }
        service_health::Mode::Migrate => {
            return service_health::database::migrate("AUTH_PG", MIGRATIONS);
        }
        service_health::Mode::Serve => (),
    }
    let telemetry = telemetry::init("auth")?;
    let result: anyhow::Result<()> = async {
        tracing::info!(target: "telemetry", event = "service.started");

        let addr: SocketAddr = "0.0.0.0:80".parse()?;
        let addr = volo::net::Address::from(addr);

        thrift::auth::AuthServiceServer::new(AuthImpl(application::Application::new()?))
            .run(addr)
            .await
            .map_err(|err| anyhow!("run fails:{}", err))?;
        Ok(())
    }
    .await;
    let shutdown = tokio::task::spawn_blocking(move || telemetry.shutdown()).await;
    if !matches!(shutdown, Ok(Ok(()))) {
        eprintln!("telemetry shutdown incomplete");
    }
    result
}
