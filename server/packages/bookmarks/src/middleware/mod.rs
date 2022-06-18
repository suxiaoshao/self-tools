use axum::{
    http::{self, Request},
    middleware::Next,
    response::Response,
};
use proto::{auth::CheckRequest, middleware::client::login_client};

use crate::errors::GraphqlError;

pub async fn auth<B>(req: Request<B>, next: Next<B>) -> Result<Response, GraphqlError> {
    let auth_header = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let auth = if let Some(auth_header) = auth_header {
        auth_header
    } else {
        return Err(GraphqlError::Unauthenticated);
    }
    .to_string();
    let mut client = login_client(None).await?;
    client.check(CheckRequest { auth }).await?;
    Ok(next.run(req).await)
}
