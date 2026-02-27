/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 01:30:22
 * @FilePath: /self-tools/server/packages/login/src/main.rs
 */
use crate::router::get_router;
use ::middleware::{get_cors, trace_layer};
use anyhow::Result;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_sessions::{
    Expiry, MemoryStore, SessionManagerLayer,
    cookie::{SameSite, time::Duration},
};
use tracing::{Level, event, metadata::LevelFilter};
use tracing_subscriber::{
    Layer, fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt,
};
pub mod errors;
mod middleware;
mod router;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    // 设置跨域
    let cors = get_cors();

    let session_store = MemoryStore::default();

    // 获取路由
    let app = get_router()?.layer(cors).layer(trace_layer()).layer(
        SessionManagerLayer::new(session_store)
            .with_name("webauthnrs")
            .with_same_site(SameSite::Strict)
            .with_secure(false) // TODO: change this to true when running on an HTTPS/production server instead of locally
            .with_expiry(Expiry::OnInactivity(Duration::seconds(360))),
    );

    // run our app with hyper
    // `axum::Server` is a re-export of `hyper::Server`
    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    let listener = TcpListener::bind(addr).await?;

    event!(Level::INFO, "server start on {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}
