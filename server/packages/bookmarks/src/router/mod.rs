/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-23 03:28:35
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-23 21:11:30
 * @FilePath: /self-tools/server/packages/bookmarks/src/router/mod.rs
 */
mod fetch_content;
mod graphql;
use self::graphql::{graphql_handler, graphql_playground};
use crate::{errors::GraphqlResult, graphql::get_schema};
use axum::{
    routing::{get, post},
    Router,
};

pub fn get_router() -> GraphqlResult<Router> {
    let schema = get_schema()?;

    let router = Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .route("/fetch-content", get(fetch_content::fetch_content))
        .with_state(schema);
    Ok(router)
}

pub use self::graphql::Auth;
