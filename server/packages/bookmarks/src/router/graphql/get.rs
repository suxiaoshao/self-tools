use async_graphql::http::{GraphQLPlaygroundConfig, playground_source};
use axum::response::{self, IntoResponse};

pub(crate) async fn graphql_playground() -> impl IntoResponse {
    response::Html(playground_source(
        GraphQLPlaygroundConfig::new("/graphql").subscription_endpoint("/ws"),
    ))
}
