/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 18:34:48
 * @FilePath: /self-tools/server/packages/collections/src/router/graphql/post.rs
 */
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::{rejection::ExtensionRejection, State},
    http::{
        header::{AsHeaderName, AUTHORIZATION},
        HeaderMap,
    },
    Extension,
};
use middleware::TraceIdExt;

use crate::graphql::RootSchema;

pub(crate) struct Auth(pub(crate) String);

pub(crate) async fn graphql_handler(
    State(schema): State<RootSchema>,
    header: HeaderMap,
    trace_id: Result<Extension<TraceIdExt>, ExtensionRejection>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let auth = get_header_value(&header, AUTHORIZATION).map(Auth);
    let trace_id = trace_id.map(|x| x.0);
    let mut req = req.into_inner();
    if let Some(auth) = auth {
        req = req.data(auth);
    }
    if let Ok(trace_id) = trace_id {
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
