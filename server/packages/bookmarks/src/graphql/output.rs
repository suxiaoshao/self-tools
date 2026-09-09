use super::{
    enums::{NovelSite, NovelStatus},
    error::{application, read_error},
};
use crate::application;
use async_graphql::{Context, Object, Result};
use graphql_common::DateTime;
pub(crate) struct DraftAuthorInfo(pub application::DraftAuthor);
#[Object]
impl DraftAuthorInfo {
    async fn url(&self) -> String {
        self.0.url.clone()
    }
    async fn name(&self) -> String {
        self.0.name.clone()
    }
    async fn description(&self) -> String {
        self.0.description.clone()
    }
    async fn image(&self) -> String {
        self.0.image.clone()
    }
    async fn novels(&self, ctx: &Context<'_>) -> Result<Vec<DraftNovelInfo>> {
        application(ctx)?
            .draft_author_novels(&self.0)
            .await
            .map(|v| v.into_iter().map(DraftNovelInfo).collect())
            .map_err(read_error)
    }
    async fn id(&self) -> String {
        self.0.id.clone()
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
}
pub(crate) struct DraftNovelInfo(pub application::DraftNovel);
#[Object]
impl DraftNovelInfo {
    async fn url(&self) -> String {
        self.0.url.clone()
    }
    async fn name(&self) -> String {
        self.0.name.clone()
    }
    async fn description(&self) -> String {
        self.0.description.clone()
    }
    async fn image(&self) -> String {
        self.0.image.clone()
    }
    async fn chapters(&self) -> Vec<DraftChapterInfo> {
        self.0
            .chapters
            .iter()
            .cloned()
            .map(DraftChapterInfo)
            .collect()
    }
    async fn author(&self, ctx: &Context<'_>) -> Result<DraftAuthorInfo> {
        application(ctx)?
            .draft_novel_author(&self.0)
            .await
            .map(DraftAuthorInfo)
            .map_err(read_error)
    }
    async fn status(&self) -> NovelStatus {
        self.0.status.into()
    }
    async fn id(&self) -> String {
        self.0.id.clone()
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
    async fn tags(&self) -> Vec<DraftTagInfo> {
        self.0.tags.iter().cloned().map(DraftTagInfo).collect()
    }
}
pub(crate) struct DraftChapterInfo(pub application::DraftChapter);
#[Object]
impl DraftChapterInfo {
    async fn url(&self) -> String {
        self.0.url.clone()
    }
    async fn title(&self) -> String {
        self.0.title.clone()
    }
    async fn time(&self) -> DateTime {
        self.0.time.into()
    }
    async fn word_count(&self) -> u32 {
        self.0.word_count
    }
    async fn novel_id(&self) -> String {
        self.0.novel_id.clone()
    }
    async fn id(&self) -> String {
        self.0.id.clone()
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
}
pub(crate) struct DraftTagInfo(pub application::DraftTag);
#[Object]
impl DraftTagInfo {
    async fn url(&self) -> String {
        self.0.url.clone()
    }
    async fn id(&self) -> String {
        self.0.id.clone()
    }
    async fn name(&self) -> String {
        self.0.name.clone()
    }
}
