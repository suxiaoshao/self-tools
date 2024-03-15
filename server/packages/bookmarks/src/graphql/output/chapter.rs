use std::ops::Deref;

/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 20:44:29
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-04 21:15:52
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/output/chapter.rs
 */
use async_graphql::Object;

use novel_crawler::{ChapterFn, JJChapter as JJChapterInner, QDChapter as QDChapterInner};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QdChapter(pub QDChapterInner);

#[Object]
impl QdChapter {
    async fn url(&self) -> String {
        self.0.url()
    }
    async fn title(&self) -> String {
        self.0.title().to_owned()
    }
    async fn time(&self) -> String {
        self.0.time().to_owned()
    }
    async fn word_count(&self) -> u32 {
        self.0.word_count()
    }
}

impl Deref for QdChapter {
    type Target = QDChapterInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<QDChapterInner> for QdChapter {
    fn from(inner: QDChapterInner) -> Self {
        Self(inner)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JjChapter(pub JJChapterInner);

#[Object]
impl JjChapter {
    async fn url(&self) -> String {
        self.0.url()
    }
    async fn title(&self) -> String {
        self.0.title().to_owned()
    }
    async fn time(&self) -> String {
        self.0.time().to_owned()
    }
    async fn word_count(&self) -> u32 {
        self.0.word_count()
    }
}

impl Deref for JjChapter {
    type Target = JJChapterInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<JJChapterInner> for JjChapter {
    fn from(inner: JJChapterInner) -> Self {
        Self(inner)
    }
}