use std::env::var;

use anyhow::Result;
use once_cell::sync::Lazy;
use proto::auth::login_server::LoginServer;
use tonic::transport::Server;

use crate::greeter::login::LoginGreeter;

static PASSWORD: Lazy<String> = Lazy::new(|| var("PASSWORD").expect("password not set"));
static USERNAME: Lazy<String> = Lazy::new(|| var("USERNAME").expect("username not set"));
static SECRET_KEY: Lazy<String> = Lazy::new(|| var("SECRET").expect("secret key not set"));

mod greeter;
mod utils;
#[tokio::main]
async fn main() -> Result<()> {
    let addr = "0.0.0.0:80".parse()?;

    let login_greeter = LoginGreeter;
    println!("GreeterServer listening on {addr}");

    Server::builder()
        .add_service(LoginServer::new(login_greeter))
        .serve(addr)
        .await?;

    Ok(())
}
