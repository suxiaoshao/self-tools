/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 06:08:36
 * @FilePath: /self-tools/server/packages/collections/src/main.rs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
mod errors;
const MIGRATIONS: diesel_migrations::EmbeddedMigrations =
    diesel_migrations::embed_migrations!("migrations");
mod graphql;
mod model;
mod router;
mod service;

use std::net::SocketAddr;

use middleware::{get_cors, trace_layer};
use router::get_router;
use tokio::net::TcpListener;
use tracing::{Level, event, metadata::LevelFilter};
use tracing_subscriber::{
    Layer, fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    match service_health::mode(true)? {
        service_health::Mode::Help => {
            service_health::help(true);
            return Ok(());
        }
        service_health::Mode::CheckReady => {
            return service_health::probe_http("127.0.0.1:8080");
        }
        service_health::Mode::Migrate => {
            return service_health::database::migrate("COLLECTIONS_PG", MIGRATIONS);
        }
        service_health::Mode::Serve => (),
    }
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    // 设置跨域
    let cors = get_cors()?;
    let app = get_router()
        .map_err(|_x| anyhow::anyhow!("VarError"))?
        .layer(cors)
        .layer(trace_layer());

    let addr = "0.0.0.0:8080";
    event!(Level::INFO, addr, "server start");
    let addr: SocketAddr = addr.parse()?;
    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
