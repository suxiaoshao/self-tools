/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-02 16:34:59
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-02 17:56:59
 * @FilePath: /self-tools/server/packages/bookmarks/src/router/fetch_content.rs
 */

use axum::{
    body::Bytes,
    extract::{rejection::QueryRejection, Query},
    http::{HeaderMap, HeaderName, HeaderValue, StatusCode},
};
use serde::Deserialize;

use crate::errors::GraphqlResult;

#[derive(Deserialize, Debug)]
pub struct Data {
    url: String,
}

pub async fn fetch_content(
    data: Result<Query<Data>, QueryRejection>,
) -> GraphqlResult<(StatusCode, HeaderMap, Bytes)> {
    let data = data?;
    let url = data.0.url;
    let response = reqwest::get(url).await?;
    let status = response.status().as_u16();
    let source_headers = response.headers();
    let mut headers = HeaderMap::new();
    source_headers.iter().for_each(|(key, value)| {
        if let (Ok(key), Ok(value)) = (
            HeaderName::from_bytes(key.as_str().as_bytes()),
            HeaderValue::from_bytes(value.as_bytes()),
        ) {
            headers.append(key, value);
        }
    });
    let body = response.bytes().await?;

    Ok((
        StatusCode::from_u16(status).unwrap_or_default(),
        headers,
        body,
    ))
}
