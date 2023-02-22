mod errors;
mod graphql;
mod model;
mod router;
mod service;

use axum::Server;
use middleware::{get_cors, trace_layer};
use router::get_router;
use tracing::{event, metadata::LevelFilter, Level};
use tracing_subscriber::{
    fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
};

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
    let addr = addr.parse()?;
    Server::bind(&addr).serve(app.into_make_service()).await?;
    Ok(())
}
