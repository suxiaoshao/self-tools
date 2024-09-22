mod graphql;
use self::graphql::{graphql_handler, graphql_playground};
use crate::graphql::get_schema;
use axum::{routing::post, Router};

pub(crate) fn get_router() -> Router {
    let schema = get_schema();

    Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .with_state(schema)
}

pub(crate) use self::graphql::Auth;
