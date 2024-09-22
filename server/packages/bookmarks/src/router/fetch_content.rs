/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-02 16:34:59
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-23 01:59:36
 * @FilePath: /self-tools/server/packages/bookmarks/src/router/fetch_content.rs
 */

use axum::{
    body::Body,
    extract::{rejection::QueryRejection, Query},
    http::{HeaderMap, StatusCode},
};
use serde::Deserialize;

use crate::errors::GraphqlResult;

#[derive(Deserialize, Debug)]
pub(crate) struct Data {
    url: String,
}

pub(crate) async fn fetch_content(
    data: Result<Query<Data>, QueryRejection>,
) -> GraphqlResult<(StatusCode, HeaderMap, Body)> {
    let data = data?;
    let url = data.0.url;
    let response = reqwest::get(url).await?;
    let status = response.status();
    let headers = response.headers().clone();
    let body = response.bytes_stream();
    let body = Body::from_stream(body);
    Ok((status, headers, body))
}
