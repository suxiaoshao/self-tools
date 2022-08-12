use axum::Router;
use axum::{body::Body, routing::post};
mod login;
pub(crate) fn get_router() -> Router<Body> {
    Router::new().route("/api/login", post(login::login))
}
