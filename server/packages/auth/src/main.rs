use crate::greeter::login::LoginGreeter;
use anyhow::Result;
use proto::auth::login_server::LoginServer;
use tonic::transport::Server;

mod greeter;
mod utils;
#[tokio::main]
async fn main() -> Result<()> {
    let addr = "0.0.0.0:80".parse()?;

    let login_greeter = LoginGreeter;

    Server::builder()
        .add_service(LoginServer::new(login_greeter))
        .serve(addr)
        .await?;

    Ok(())
}
