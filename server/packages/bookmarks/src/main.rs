/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-23 21:22:23
 * @FilePath: /self-tools/server/packages/bookmarks/src/main.rs
 */
mod errors;
const MIGRATIONS: diesel_migrations::EmbeddedMigrations =
    diesel_migrations::embed_migrations!("migrations");
mod graphql;
mod model;
mod router;
mod service;

use std::net::SocketAddr;

use middleware::get_cors;
use tokio::net::TcpListener;
use tracing::{Level, event, metadata::LevelFilter};
use tracing_subscriber::{
    Layer, fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt,
};

use crate::router::get_router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    match service_health::mode(true)? {
        service_health::Mode::Help => {
            service_health::help(true);
            return Ok(());
        }
        service_health::Mode::CheckReady => {
            return service_health::probe_http("127.0.0.1:8080").await;
        }
        service_health::Mode::Migrate => {
            return service_health::database::migrate("BOOKMARKS_PG", MIGRATIONS);
        }
        service_health::Mode::Serve => (),
    }
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    // 设置跨域
    let cors = get_cors()?;
    let app = get_router()?.layer(cors);

    let addr = "0.0.0.0:8080";
    event!(Level::INFO, addr, "server start");
    let addr: SocketAddr = addr.parse()?;
    let listener = TcpListener::bind(addr).await?;

    axum::serve(listener, app).await?;
    Ok(())
}
