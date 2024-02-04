use std::ops::Deref;

/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 20:44:15
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-04 03:12:30
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/output/author.rs
 */
use async_graphql::Object;

use novel_crawler::{AuthorFn, JJAuthor as JJAuthorInner, QDAuthor as QDAuthorInner};

use crate::errors::GraphqlResult;

use super::novel::{JjNovel, QdNovel};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QdAuthor(pub QDAuthorInner);

impl From<QDAuthorInner> for QdAuthor {
    fn from(inner: QDAuthorInner) -> Self {
        Self(inner)
    }
}

impl Deref for QdAuthor {
    type Target = QDAuthorInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[Object]
impl QdAuthor {
    async fn url(&self) -> String {
        self.0.url()
    }
    async fn name(&self) -> String {
        self.0.name().to_owned()
    }
    async fn description(&self) -> String {
        self.0.description().to_owned()
    }
    async fn image(&self) -> String {
        self.0.image().to_owned()
    }
    async fn novels(&self) -> GraphqlResult<Vec<QdNovel>> {
        let data = self.0.novels().await?;
        Ok(data.into_iter().map(QdNovel::from).collect())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JjAuthor(pub JJAuthorInner);

impl From<JJAuthorInner> for JjAuthor {
    fn from(inner: JJAuthorInner) -> Self {
        Self(inner)
    }
}

impl Deref for JjAuthor {
    type Target = JJAuthorInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[Object]
impl JjAuthor {
    async fn url(&self) -> String {
        self.0.url()
    }
    async fn name(&self) -> String {
        self.0.name().to_owned()
    }
    async fn description(&self) -> String {
        self.0.description().to_owned()
    }
    async fn image(&self) -> String {
        self.0.image().to_owned()
    }
    async fn novels(&self) -> GraphqlResult<Vec<JjNovel>> {
        let data = self.0.novels().await?;
        Ok(data.into_iter().map(JjNovel::from).collect())
    }
}
