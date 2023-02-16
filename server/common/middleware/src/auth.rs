use axum::{
    http::{self, Request},
    middleware::Next,
    response::Response,
};
use proto::{auth::CheckRequest, middleware::client::login_client};

use crate::TraceIdExt;

pub struct Unauthenticated;

pub async fn auth<B, E>(req: Request<B>, next: Next<B>) -> Result<Response, E>
where
    E: From<tonic::transport::Error> + From<tonic::Status> + From<Unauthenticated>,
{
    let auth_header = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let auth = if let Some(auth_header) = auth_header {
        auth_header
    } else {
        return Err(Unauthenticated.into());
    }
    .to_string();
    let trace_id = req.extensions().get::<TraceIdExt>().cloned().map(|x| x.0);
    let mut client = login_client(None, trace_id).await?;
    client.check(CheckRequest { auth }).await?;
    Ok(next.run(req).await)
}
