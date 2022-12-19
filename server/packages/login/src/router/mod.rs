use axum::routing::post;
use axum::Router;
mod login;
pub(crate) fn get_router() -> Router {
    Router::new().route("/api/login", post(login::login))
}
