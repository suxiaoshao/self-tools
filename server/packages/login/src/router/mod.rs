use crate::errors::OpenResult;
use crate::router::webauthn::WebauthnContainer;
use axum::routing::post;
use axum::Router;
mod login;
mod webauthn;
pub(crate) fn get_router() -> OpenResult<Router> {
    let router = Router::new()
        .route("/api/login", post(login::login))
        .route("/api/start-register", post(webauthn::start_register))
        .route("/api/finish-register", post(webauthn::finish_register))
        .with_state(WebauthnContainer::new()?);
    Ok(router)
}
