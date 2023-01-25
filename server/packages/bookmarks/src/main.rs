mod errors;
mod graphql;
mod model;
mod service;

use async_graphql::{
    http::{playground_source, GraphQLPlaygroundConfig},
    EmptySubscription, Schema,
};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    extract::State,
    http::{header::AUTHORIZATION, HeaderMap},
    response::{self, IntoResponse},
    routing::post,
    Router, Server,
};
use errors::GraphqlError;
use graphql::{mutation::MutationRoot, query::QueryRoot, RootSchema};
use middleware::auth;
use middleware::get_cors;
use model::CONNECTION;

async fn graphql_handler(
    State(schema): State<RootSchema>,
    header: HeaderMap,
    req: GraphQLRequest,
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
    let _ = &CONNECTION.get()?;
    // 设置跨域
    let cors = get_cors();
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish();

    let app = Router::new()
        .route(
            "/graphql",
            post(graphql_handler)
                .layer(axum::middleware::from_fn(auth::<_, GraphqlError>))
                .get(graphql_playground),
        )
        .with_state(schema)
        .layer(cors);

    Server::bind(&"0.0.0.0:8080".parse()?)
        .serve(app.into_make_service())
        .await?;
    Ok(())
}
