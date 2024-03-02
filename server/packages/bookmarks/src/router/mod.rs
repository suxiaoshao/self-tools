/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-23 03:28:35
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-02 17:58:32
 * @FilePath: /self-tools/server/packages/bookmarks/src/router/mod.rs
 */
mod fetch_content;
mod graphql;
use self::graphql::{graphql_handler, graphql_playground};
use crate::graphql::get_schema;
use axum::{
    routing::{get, post},
    Router,
};

pub fn get_router() -> Router {
    let schema = get_schema();

    Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .route("/fetch-content", get(fetch_content::fetch_content))
        .with_state(schema)
}

pub use self::graphql::Auth;
