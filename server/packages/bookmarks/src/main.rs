/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 01:34:13
 * @FilePath: /self-tools/server/packages/bookmarks/src/main.rs
 */
mod errors;
mod graphql;
mod model;
mod router;
mod service;

use std::net::SocketAddr;

use middleware::{get_cors, trace_layer};
use tokio::net::TcpListener;
use tracing::{event, metadata::LevelFilter, Level};
use tracing_subscriber::{
    fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
};

use crate::router::get_router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    // 设置跨域
    let cors = get_cors();
    let app = get_router().layer(cors).layer(trace_layer());

    let addr = "0.0.0.0:8080";
    event!(Level::INFO, addr, "server start");
    let addr: SocketAddr = addr.parse()?;
    let listener = TcpListener::bind(addr).await?;

    axum::serve(listener, app).await?;
    Ok(())
}
