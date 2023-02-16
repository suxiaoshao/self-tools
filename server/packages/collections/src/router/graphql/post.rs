use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::State,
    http::{
        header::{AsHeaderName, AUTHORIZATION},
        HeaderMap,
    },
    Extension,
};
use middleware::TraceIdExt;

use crate::graphql::RootSchema;

pub struct Auth(pub String);

pub async fn graphql_handler(
    State(schema): State<RootSchema>,
    header: HeaderMap,
    trace_id: Option<Extension<TraceIdExt>>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let auth = get_header_value(&header, AUTHORIZATION).map(Auth);
    let trace_id = trace_id.map(|x| x.0);
    let mut req = req.into_inner();
    if let Some(auth) = auth {
        req = req.data(auth);
    }
    if let Some(trace_id) = trace_id {
        req = req.data(trace_id);
    }
    schema.execute(req).await.into()
}

fn get_header_value<K>(header: &HeaderMap, key: K) -> Option<String>
where
    K: AsHeaderName,
{
    header
        .get(key)
        .and_then(|x| x.to_str().ok())
        .map(|x| x.to_string())
}
