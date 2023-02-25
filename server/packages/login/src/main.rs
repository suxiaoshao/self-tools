use crate::router::get_router;
use ::middleware::{get_cors, trace_layer};
use anyhow::Result;
use std::net::SocketAddr;
use tracing::{event, metadata::LevelFilter, Level};
use tracing_subscriber::{
    fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
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

    // 获取路由
    let app = get_router().layer(cors).layer(trace_layer());

    // run our app with hyper
    // `axum::Server` is a re-export of `hyper::Server`
    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    event!(Level::INFO, "server start on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}
