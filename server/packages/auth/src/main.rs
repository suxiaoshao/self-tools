use crate::greeter::login::LoginGreeter;
use anyhow::Result;
use proto::auth::login_server::LoginServer;
use tonic::transport::Server;
use tracing::{event, metadata::LevelFilter, Level};
use tracing_subscriber::{
    fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
};

mod greeter;
mod utils;
#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();
    let login_greeter = LoginGreeter;
    let addr = "0.0.0.0:80";
    event!(Level::INFO, addr, "server start on 80");
    let addr = addr.parse()?;
    Server::builder()
        .layer(middleware::trace_layer())
        .add_service(LoginServer::new(login_greeter))
        .serve(addr)
        .await?;

    Ok(())
}
