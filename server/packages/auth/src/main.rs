/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-17 00:00:32
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-19 02:06:30
 * @FilePath: /self-tools/server/packages/new_auth/src/main.rs
 */
use anyhow::anyhow;
use std::net::SocketAddr;
use tracing::{Level, event, level_filters::LevelFilter};
use tracing_subscriber::{Layer, fmt, layer::SubscriberExt, util::SubscriberInitExt};

use service::AuthImpl;

use crate::middleware::LogLayer;

mod application;
const MIGRATIONS: diesel_migrations::EmbeddedMigrations =
    diesel_migrations::embed_migrations!("migrations");
mod middleware;
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
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    let addr = "0.0.0.0:80";
    event!(Level::INFO, addr, "server start on 80");

    let addr: SocketAddr = "0.0.0.0:80".parse()?;
    let addr = volo::net::Address::from(addr);

    thrift::auth::AuthServiceServer::new(AuthImpl(application::Application::new()?))
        .layer(LogLayer)
        .run(addr)
        .await
        .map_err(|err| anyhow!("run fails:{}", err))?;
    Ok(())
}
