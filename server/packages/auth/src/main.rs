/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-17 00:00:32
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-19 02:06:30
 * @FilePath: /self-tools/server/packages/new_auth/src/main.rs
 */
use anyhow::anyhow;
use std::net::SocketAddr;
use tracing::{event, level_filters::LevelFilter, Level};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, Layer};

use service::AuthImpl;

use crate::middleware::LogLayer;

mod middleware;
mod service;
mod utils;

#[volo::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    let addr = "0.0.0.0:80";
    event!(Level::INFO, addr, "server start on 80");

    let addr: SocketAddr = "0.0.0.0:80".parse()?;
    let addr = volo::net::Address::from(addr);

    thrift::auth::ItemServiceServer::new(AuthImpl)
        .layer(LogLayer)
        .run(addr)
        .await
        .map_err(|err| anyhow!("run fails:{}", err))?;
    Ok(())
}
