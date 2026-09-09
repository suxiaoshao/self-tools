use super::enums::{NovelSite, NovelStatus};
use crate::application;
use crate::graphql::loaders;
use async_graphql::{Context, Object, Result, SimpleObject};
use graphql_common::DateTime;
pub(crate) struct Author(pub std::sync::Arc<application::Author>);
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
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn novels(&self, ctx: &Context<'_>) -> Result<Option<Vec<Novel>>> {
        let data = loaders::load(ctx, loaders::AuthorNovels(self.0.id))
            .await?
            .unwrap_or_default();
        loaders::novels(ctx, &data, ctx.look_ahead()).await;
        Ok(Some(data.into_iter().map(Novel).collect()))
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
graphql_common::list!(Author);
pub(crate) struct Tag(pub std::sync::Arc<application::Tag>);
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
pub(crate) struct Collection(pub std::sync::Arc<application::Collection>);
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
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn ancestors(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        Ok(Some(
            loaders::ancestors(ctx, self.0.id)
                .await?
                .into_iter()
                .map(Collection)
                .collect(),
        ))
    }
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn children(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        Ok(Some(
            loaders::load(ctx, loaders::Children(self.0.id))
                .await?
                .unwrap_or_default()
                .into_iter()
                .map(Collection)
                .collect(),
        ))
    }
}
graphql_common::list!(Collection);
pub(crate) struct Chapter(pub std::sync::Arc<application::Chapter>);
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
        Ok(loaders::load(ctx, loaders::Novels(self.0.novel_id))
            .await?
            .map(Novel))
    }
    async fn author(&self, ctx: &Context<'_>) -> Result<Option<Author>> {
        Ok(loaders::load(ctx, loaders::Authors(self.0.author_id))
            .await?
            .map(Author))
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
pub(crate) struct Novel(pub std::sync::Arc<application::Novel>);
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
        Ok(loaders::load(ctx, loaders::Authors(self.0.author_id))
            .await?
            .map(Author))
    }
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn tags(&self, ctx: &Context<'_>) -> Result<Option<Vec<Tag>>> {
        Ok(Some(
            loaders::load(ctx, loaders::NovelTags(self.0.id))
                .await?
                .unwrap_or_default()
                .into_iter()
                .map(Tag)
                .collect(),
        ))
    }
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn chapters(&self, ctx: &Context<'_>) -> Result<Option<Vec<Chapter>>> {
        let data = loaders::load(ctx, loaders::Chapters(self.0.id))
            .await?
            .unwrap_or_default();
        if ctx.look_ahead().field("author").exists() {
            loaders::prefetch(ctx, data.iter().map(|v| loaders::Authors(v.author_id))).await;
        }
        if ctx.look_ahead().field("novel").exists() {
            loaders::prefetch(ctx, data.iter().map(|v| loaders::Novels(v.novel_id))).await;
        }
        Ok(Some(data.into_iter().map(Chapter).collect()))
    }
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn collections(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        Ok(Some(
            loaders::load(ctx, loaders::NovelCollections(self.0.id))
                .await?
                .unwrap_or_default()
                .into_iter()
                .map(Collection)
                .collect(),
        ))
    }
    async fn word_count(&self, ctx: &Context<'_>) -> Result<Option<bigdecimal::BigDecimal>> {
        Ok(loaders::load(ctx, loaders::Stats(self.0.id))
            .await?
            .map(|s| s.word_count))
    }
    async fn read_percentage(&self, ctx: &Context<'_>) -> Result<Option<f64>> {
        Ok(loaders::load(ctx, loaders::Stats(self.0.id))
            .await?
            .map(|s| s.read_percentage))
    }
    async fn last_chapter(&self, ctx: &Context<'_>) -> Result<Option<Chapter>> {
        Ok(loaders::load(ctx, loaders::ChapterEnds(self.0.id))
            .await?
            .and_then(|v| v.last)
            .map(Chapter))
    }
    async fn first_chapter(&self, ctx: &Context<'_>) -> Result<Option<Chapter>> {
        Ok(loaders::load(ctx, loaders::ChapterEnds(self.0.id))
            .await?
            .and_then(|v| v.first)
            .map(Chapter))
    }
    async fn comments(&self, ctx: &Context<'_>) -> Result<Option<NovelComment>> {
        Ok(loaders::load(ctx, loaders::NovelComments(self.0.id))
            .await?
            .map(NovelComment))
    }
    async fn url(&self) -> String {
        self.0.url()
    }
}
graphql_common::list!(Novel);
pub(crate) struct NovelComment(pub std::sync::Arc<application::NovelComment>);
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

impl From<crate::application::Author> for Author {
    fn from(v: crate::application::Author) -> Self {
        Self(std::sync::Arc::new(v))
    }
}

impl From<crate::application::Novel> for Novel {
    fn from(v: crate::application::Novel) -> Self {
        Self(std::sync::Arc::new(v))
    }
}

impl From<crate::application::Tag> for Tag {
    fn from(v: crate::application::Tag) -> Self {
        Self(std::sync::Arc::new(v))
    }
}

impl From<crate::application::Collection> for Collection {
    fn from(v: crate::application::Collection) -> Self {
        Self(std::sync::Arc::new(v))
    }
}

impl From<crate::application::Chapter> for Chapter {
    fn from(v: crate::application::Chapter) -> Self {
        Self(std::sync::Arc::new(v))
    }
}

impl From<crate::application::NovelComment> for NovelComment {
    fn from(v: crate::application::NovelComment) -> Self {
        Self(std::sync::Arc::new(v))
    }
}
