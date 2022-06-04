use axum::Router;
use axum::{body::Body, routing::post};

use anyhow::Result;
mod login;
pub(crate) fn get_router() -> Result<Router<Body>> {
    let router = Router::new().route("/api/login", post(login::login));
    Ok(router)
}
