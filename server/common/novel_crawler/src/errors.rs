/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 01:26:31
 * @FilePath: /self-tools/server/common/novel_crawler/src/errors.rs
 */
use thiserror::Error;

#[derive(Error, Debug)]
pub enum NovelError {
    #[error("网络错误")]
    NetworkError(reqwest::Error),
    #[error("解析错误")]
    ParseError,
    #[error("time 解析错误:{}",.0)]
    TimeParseError(#[from] time::error::Parse),
}

impl From<reqwest::Error> for NovelError {
    fn from(e: reqwest::Error) -> Self {
        NovelError::NetworkError(e)
    }
}

impl From<nom::Err<nom::error::Error<&str>>> for NovelError {
    fn from(_: nom::Err<nom::error::Error<&str>>) -> Self {
        NovelError::ParseError
    }
}
impl From<serde_json::Error> for NovelError {
    fn from(_: serde_json::Error) -> Self {
        NovelError::ParseError
    }
}

pub(crate) type NovelResult<T> = Result<T, NovelError>;
