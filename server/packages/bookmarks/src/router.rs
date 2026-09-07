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
use crate::graphql::get_schema;
use axum::{Router, routing::post};

pub(crate) fn get_router() -> anyhow::Result<Router> {
    let schema =
        get_schema().map_err(|_| anyhow::anyhow!("bookmarks schema initialization failed"))?;
    let images =
        fetch_content::image_router(std::sync::Arc::new(fetch_content::ImageProxyState::new()?));

    let router = Router::new()
        .route("/graphql", post(graphql_handler).get(graphql_playground))
        .layer(middleware::trace_layer())
        .with_state(schema)
        .merge(images);
    Ok(router)
}

pub(crate) use self::graphql::Auth;
