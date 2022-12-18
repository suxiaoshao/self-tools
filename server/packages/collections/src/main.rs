mod errors;
mod graphql;
mod model;

use async_graphql::{
    http::{playground_source, GraphQLPlaygroundConfig},
    EmptySubscription, Schema,
};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract,
    http::{header::AUTHORIZATION, HeaderMap},
    response::{self, IntoResponse},
    routing::post,
    Extension, Router, Server,
};
use cors::get_cors;
use graphql::{mutation::MutationRoot, query::QueryRoot, RootSchema};

async fn graphql_handler(
    schema: extract::Extension<RootSchema>,
    req: GraphQLRequest,
    header: HeaderMap,
) -> GraphQLResponse {
    match header
        .get(AUTHORIZATION)
        .and_then(|x| x.to_str().ok())
        .map(|x| x.to_string())
    {
        None => schema.execute(req.into_inner()).await.into(),
        Some(auth) => schema.execute(req.into_inner().data(auth)).await.into(),
    }
}

async fn graphql_playground() -> impl IntoResponse {
    response::Html(playground_source(
        GraphQLPlaygroundConfig::new("/graphql").subscription_endpoint("/ws"),
    ))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 设置跨域
    let cors = get_cors();
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();

    let app = Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .layer(Extension(schema))
        .layer(cors);

    Server::bind(&"0.0.0.0:8080".parse()?)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}
