use super::{
    enums::{NovelSite, NovelStatus},
    error::{application, read_error},
};
use crate::application;
use async_graphql::{Context, Object, Result, SimpleObject};
use graphql_common::DateTime;
pub(crate) struct Author(pub application::Author);
#[Object]
impl Author {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn name(&self) -> &str {
        &self.0.name
    }
    async fn avatar(&self) -> &str {
        &self.0.avatar
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
    async fn site_id(&self) -> &str {
        &self.0.site_id
    }
    async fn description(&self) -> &str {
        &self.0.description
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    async fn novels(&self, ctx: &Context<'_>) -> Result<Option<Vec<Novel>>> {
        application(ctx)?
            .author_novels(self.0.id)
            .await
            .map(|v| Some(v.into_iter().map(Novel).collect()))
            .map_err(read_error)
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
graphql_common::list!(Author);
pub(crate) struct Tag(pub application::Tag);
#[Object]
impl Tag {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn name(&self) -> &str {
        &self.0.name
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
    async fn site_id(&self) -> &str {
        &self.0.site_id
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
graphql_common::list!(Tag);
pub(crate) struct Collection(pub application::Collection);
#[Object]
impl Collection {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn name(&self) -> &str {
        &self.0.name
    }
    async fn path(&self) -> &str {
        &self.0.path
    }
    async fn parent_id(&self) -> Option<i64> {
        self.0.parent_id
    }
    async fn description(&self) -> Option<&str> {
        self.0.description.as_deref()
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    async fn ancestors(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        application(ctx)?
            .ancestors(self.0.id)
            .await
            .map(|v| Some(v.into_iter().map(Collection).collect()))
            .map_err(read_error)
    }
    async fn children(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        application(ctx)?
            .children(self.0.id)
            .await
            .map(|v| Some(v.into_iter().map(Collection).collect()))
            .map_err(read_error)
    }
}
graphql_common::list!(Collection);
pub(crate) struct Chapter(pub application::Chapter);
#[Object]
impl Chapter {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn title(&self) -> &str {
        &self.0.title
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
    async fn site_id(&self) -> &str {
        &self.0.site_id
    }
    async fn content(&self) -> Option<&str> {
        self.0.content.as_deref()
    }
    async fn time(&self) -> DateTime {
        self.0.time.into()
    }
    async fn word_count(&self) -> i64 {
        self.0.word_count
    }
    async fn novel_id(&self) -> i64 {
        self.0.novel_id
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    async fn site_novel_id(&self) -> &str {
        &self.0.site_novel_id
    }
    async fn is_read(&self) -> bool {
        self.0.is_read
    }
    async fn novel(&self, ctx: &Context<'_>) -> Result<Option<Novel>> {
        application(ctx)?
            .get_novel(self.0.novel_id)
            .await
            .map(|v| v.map(Novel))
            .map_err(read_error)
    }
    async fn author(&self, ctx: &Context<'_>) -> Result<Option<Author>> {
        application(ctx)?
            .get_author(self.0.author_id)
            .await
            .map(|v| v.map(Author))
            .map_err(read_error)
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
pub(crate) struct Novel(pub application::Novel);
#[Object]
impl Novel {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn name(&self) -> &str {
        &self.0.name
    }
    async fn avatar(&self) -> &str {
        &self.0.avatar
    }
    async fn description(&self) -> &str {
        &self.0.description
    }
    async fn novel_status(&self) -> NovelStatus {
        self.0.novel_status.into()
    }
    async fn site(&self) -> NovelSite {
        self.0.site.into()
    }
    async fn site_id(&self) -> &str {
        &self.0.site_id
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    async fn author(&self, ctx: &Context<'_>) -> Result<Option<Author>> {
        application(ctx)?
            .get_author(self.0.author_id)
            .await
            .map(|v| v.map(Author))
            .map_err(read_error)
    }
    async fn tags(&self, ctx: &Context<'_>) -> Result<Option<Vec<Tag>>> {
        application(ctx)?
            .tags_by_ids(self.0.tags.clone())
            .await
            .map(|v| Some(v.into_iter().map(Tag).collect()))
            .map_err(read_error)
    }
    async fn chapters(&self, ctx: &Context<'_>) -> Result<Option<Vec<Chapter>>> {
        application(ctx)?
            .novel_chapters(self.0.id, self.0.site_id.clone())
            .await
            .map(|v| Some(v.into_iter().map(Chapter).collect()))
            .map_err(read_error)
    }
    async fn collections(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        application(ctx)?
            .novel_collections(self.0.id)
            .await
            .map(|v| Some(v.into_iter().map(Collection).collect()))
            .map_err(read_error)
    }
    async fn word_count(&self, ctx: &Context<'_>) -> Result<Option<bigdecimal::BigDecimal>> {
        application(ctx)?
            .novel_word_count(self.0.id)
            .await
            .map(Some)
            .map_err(read_error)
    }
    async fn read_percentage(&self, ctx: &Context<'_>) -> Result<Option<f64>> {
        application(ctx)?
            .novel_read_percentage(self.0.id)
            .await
            .map(Some)
            .map_err(read_error)
    }
    async fn last_chapter(&self, ctx: &Context<'_>) -> Result<Option<Chapter>> {
        application(ctx)?
            .last_chapter(self.0.id, self.0.site_id.clone())
            .await
            .map(|v| v.map(Chapter))
            .map_err(read_error)
    }
    async fn first_chapter(&self, ctx: &Context<'_>) -> Result<Option<Chapter>> {
        application(ctx)?
            .first_chapter(self.0.id, self.0.site_id.clone())
            .await
            .map(|v| v.map(Chapter))
            .map_err(read_error)
    }
    async fn comments(&self, ctx: &Context<'_>) -> Result<Option<NovelComment>> {
        application(ctx)?
            .novel_comments(self.0.id)
            .await
            .map(|v| v.map(NovelComment))
            .map_err(read_error)
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
graphql_common::list!(Novel);
pub(crate) struct NovelComment(pub application::NovelComment);
#[Object]
impl NovelComment {
    async fn content(&self) -> &str {
        &self.0.content
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
}
