use crate::graphql::RootSchema;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    Extension,
    extract::{State, rejection::ExtensionRejection},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Response},
};
use middleware::{TraceIdExt, auth_http};
use thrift::auth::{AuthServiceCheckException, Context, FailureCode};
use volo_thrift::MaybeException;
pub(crate) struct Auth;
pub(crate) async fn graphql_handler(
    State(schema): State<RootSchema>,
    headers: HeaderMap,
    trace_id: Result<Extension<TraceIdExt>, ExtensionRejection>,
    req: GraphQLRequest,
) -> Response {
    let origin = match auth_http::configured_origin() {
        Ok(v) => v,
        Err(_) => return failure(StatusCode::SERVICE_UNAVAILABLE, "AUTH_UNAVAILABLE"),
    };
    if auth_http::validate_request(&headers, &Method::POST, &origin).is_err() {
        return failure(StatusCode::FORBIDDEN, "REQUEST_REJECTED");
    }
    let token = match auth_http::cookie(&headers, auth_http::SESSION_COOKIE) {
        Ok(Some(v)) => v,
        Ok(None) => return failure(StatusCode::UNAUTHORIZED, "UNAUTHENTICATED"),
        Err(_) => return failure(StatusCode::FORBIDDEN, "REQUEST_REJECTED"),
    };
    let client = match thrift::get_client() {
        Ok(v) => v,
        Err(_) => return failure(StatusCode::SERVICE_UNAVAILABLE, "AUTH_UNAVAILABLE"),
    };
    let trace = trace_id
        .map(|v| v.0)
        .unwrap_or_else(|_| TraceIdExt(String::new()));
    match client
        .check(Context {
            trace_id: trace.0.clone().into(),
            session_token: Some(token.into()),
        })
        .await
    {
        Ok(MaybeException::Ok(_)) => {}
        Ok(MaybeException::Exception(AuthServiceCheckException::Err(e)))
            if e.code == FailureCode::UNAUTHENTICATED =>
        {
            return failure(StatusCode::UNAUTHORIZED, "UNAUTHENTICATED");
        }
        _ => return failure(StatusCode::SERVICE_UNAVAILABLE, "AUTH_UNAVAILABLE"),
    }
    let mut response = GraphQLResponse::from(
        schema
            .execute(req.into_inner().data(Auth).data(trace))
            .await,
    )
    .into_response();
    response
        .headers_mut()
        .insert("cache-control", "no-store".parse().unwrap());
    response
}
fn failure(status: StatusCode, code: &str) -> Response {
    let mut response = (
        status,
        axum::Json(serde_json::json!({"code":code,"message":code})),
    )
        .into_response();
    response
        .headers_mut()
        .insert("cache-control", "no-store".parse().unwrap());
    response
}
