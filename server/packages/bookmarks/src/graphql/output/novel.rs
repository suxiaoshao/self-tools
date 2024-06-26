/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 20:44:22
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:44:02
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/output/novel.rs
 */
use async_graphql::Object;
use novel_crawler::{JJNovel as JJNovelInner, NovelFn, QDNovel as QDNovelInner};
use std::ops::Deref;

use crate::{errors::GraphqlResult, model::schema::custom_type::NovelStatus};

use super::{
    author::{JjAuthor, QdAuthor},
    chapter::{JjChapter, QdChapter},
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QdNovel(pub QDNovelInner);

#[Object]
impl QdNovel {
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
    async fn chapters(&self) -> GraphqlResult<Vec<QdChapter>> {
        let data = self.0.chapters().await?;
        Ok(data.into_iter().map(QdChapter::from).collect())
    }
    async fn author(&self) -> GraphqlResult<QdAuthor> {
        let data = self.0.author().await?;
        Ok(data.into())
    }
    async fn status(&self) -> NovelStatus {
        self.0.status().into()
    }
    async fn id(&self) -> String {
        self.0.id().to_owned()
    }
}

impl Deref for QdNovel {
    type Target = QDNovelInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<QDNovelInner> for QdNovel {
    fn from(inner: QDNovelInner) -> Self {
        Self(inner)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JjNovel(pub JJNovelInner);

impl Deref for JjNovel {
    type Target = JJNovelInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<JJNovelInner> for JjNovel {
    fn from(inner: JJNovelInner) -> Self {
        Self(inner)
    }
}

#[Object]
impl JjNovel {
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
    async fn chapters(&self) -> GraphqlResult<Vec<JjChapter>> {
        let data = self.0.chapters().await?;
        Ok(data.into_iter().map(JjChapter::from).collect())
    }
    async fn author(&self) -> GraphqlResult<JjAuthor> {
        let data = self.0.author().await?;
        Ok(data.into())
    }
    async fn status(&self) -> NovelStatus {
        self.0.status().into()
    }
    async fn id(&self) -> String {
        self.0.id().to_owned()
    }
}
