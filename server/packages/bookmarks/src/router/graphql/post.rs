use crate::graphql::RootSchema;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    Extension,
    extract::State,
    http::{HeaderMap, Method},
    response::{IntoResponse, Response},
};
use middleware::{HttpError, RequestCorrelation, auth_http};
use service_errors::{Fault, PublicCode};
pub(crate) struct Auth;
pub(crate) async fn graphql_handler(
    State(schema): State<RootSchema>,
    headers: HeaderMap,
    Extension(origin): Extension<String>,
    correlation: Option<Extension<RequestCorrelation>>,
    req: GraphQLRequest<HttpError>,
) -> Result<Response, HttpError> {
    auth_http::validate_request(&headers, &Method::POST, &origin)
        .map_err(|_| HttpError::new(PublicCode::RequestRejected))?;
    let token = auth_http::session_cookie(&headers)
        .map_err(|_| HttpError::new(PublicCode::RequestRejected))?
        .ok_or_else(|| HttpError::new(PublicCode::Unauthenticated))?;
    schema
        .data::<std::sync::Arc<crate::application::Application>>()
        .ok_or_else(|| Fault::internal("graphql_application"))?
        .authenticate(token)
        .await
        .map_err(HttpError)?;
    let correlation = correlation
        .map(|extension| extension.0)
        .ok_or_else(|| Fault::internal("request_correlation"))?;
    let mut response = GraphQLResponse::from(
        schema
            .execute(req.into_inner().data(Auth).data(correlation))
            .await,
    )
    .into_response();
    response
        .headers_mut()
        .insert("cache-control", "no-store".parse().unwrap());
    Ok(response)
}
