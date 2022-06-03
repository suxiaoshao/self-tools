use crate::router::get_router;
use anyhow::Result;
use middleware::cors::get_cors;
use std::net::SocketAddr;
pub mod errors;
mod middleware;
mod router;

#[tokio::main]
async fn main() -> Result<()> {
    // 设置跨域
    let cors = get_cors()?;

    // 获取路由
    let app = get_router()?.layer(cors);

    // run our app with hyper
    // `axum::Server` is a re-export of `hyper::Server`
    let addr = SocketAddr::from(([0, 0, 0, 0], 80));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}
