mod graphql;
use self::graphql::{graphql_handler, graphql_playground};
use crate::{errors::GraphqlResult, graphql::get_schema};
use axum::{routing::post, Router};

pub(crate) fn get_router() -> GraphqlResult<Router> {
    let schema = get_schema()?;

    let router = Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .with_state(schema);
    Ok(router)
}

pub(crate) use self::graphql::Auth;
