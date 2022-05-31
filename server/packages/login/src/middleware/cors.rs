use axum::http::{
    header::{InvalidHeaderName, AUTHORIZATION, CONTENT_TYPE},
    Method,
};
use tower_http::cors::{AllowOrigin, CorsLayer};

pub fn get_cors() -> Result<CorsLayer, InvalidHeaderName> {
    Ok(CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods(vec![Method::GET, Method::POST, Method::PUT])
        // allow requests from any origin
        .allow_origin(AllowOrigin::predicate(|_, _| true))
        .allow_headers(vec![CONTENT_TYPE, AUTHORIZATION])
        .allow_credentials(true))
}
