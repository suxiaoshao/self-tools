use super::{
    enums::{NovelSite, NovelStatus},
    error::{detail, with_conn},
};
use crate::{
    model::{
        chapter::ChapterModel, novel::NovelModel, novel_comment::NovelCommentModel,
        read_record::ReadRecordModel,
    },
    service,
};
use async_graphql::{Context, Object, Result, SimpleObject};
use graphql_common::DateTime;
use novel_crawler::{
    AuthorFn, ChapterFn, JJAuthor, JJChapter, JJNovel, JJTag, NovelFn, QDAuthor, QDChapter,
    QDNovel, QDTag, TagFn,
};
pub(crate) struct Author(pub service::author::Author);
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
        with_conn(ctx, |c| {
            Ok(NovelModel::query_by_author_id(self.0.id, c)?
                .into_iter()
                .map(|v| Novel(v.into()))
                .collect())
        })
        .map(Some)
    }
    async fn url(&self) -> String {
        match self.0.site {
            crate::model::schema::custom_type::NovelSite::Qidian => {
                QDAuthor::get_url_from_id(&self.0.site_id)
            }
            crate::model::schema::custom_type::NovelSite::Jjwxc => {
                JJAuthor::get_url_from_id(&self.0.site_id)
            }
        }
    }
}
graphql_common::list!(Author);
pub(crate) struct Tag(pub service::tag::Tag);
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
        match self.0.site {
            crate::model::schema::custom_type::NovelSite::Qidian => {
                QDTag::get_url_from_id(&self.0.site_id)
            }
            crate::model::schema::custom_type::NovelSite::Jjwxc => {
                JJTag::get_url_from_id(&self.0.site_id)
            }
        }
    }
}
graphql_common::list!(Tag);
pub(crate) struct Collection(pub service::collection::Collection);
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
        with_conn(ctx, |c| {
            service::collection::Collection::get_ancestors(self.0.id, c)
        })
        .map(|v| Some(v.into_iter().map(Collection).collect()))
    }
    async fn children(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        with_conn(ctx, |c| {
            service::collection::Collection::get_list_parent_id(Some(self.0.id), c)
        })
        .map(|v| Some(v.into_iter().map(Collection).collect()))
    }
}
graphql_common::list!(Collection);
pub(crate) struct Chapter(pub service::chapter::Chapter);
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
        with_conn(ctx, |c| {
            detail(service::novel::Novel::get(self.0.novel_id, c))
        })
        .map(|v| v.map(Novel))
    }
    async fn author(&self, ctx: &Context<'_>) -> Result<Option<Author>> {
        with_conn(ctx, |c| {
            detail(service::author::Author::get(self.0.author_id, c))
        })
        .map(|v| v.map(Author))
    }
    async fn url(&self) -> String {
        match self.0.site {
            crate::model::schema::custom_type::NovelSite::Qidian => {
                QDChapter::get_url_from_id(&self.0.site_id, &self.0.site_novel_id)
            }
            crate::model::schema::custom_type::NovelSite::Jjwxc => {
                JJChapter::get_url_from_id(&self.0.site_id, &self.0.site_novel_id)
            }
        }
    }
}
pub(crate) struct Novel(pub service::novel::Novel);
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
        with_conn(ctx, |c| {
            detail(service::author::Author::get(self.0.author_id, c))
        })
        .map(|v| v.map(Author))
    }
    async fn tags(&self, ctx: &Context<'_>) -> Result<Option<Vec<Tag>>> {
        with_conn(ctx, |c| service::tag::Tag::get_by_ids(&self.0.tags, c))
            .map(|v| Some(v.into_iter().map(Tag).collect()))
    }
    async fn chapters(&self, ctx: &Context<'_>) -> Result<Option<Vec<Chapter>>> {
        with_conn(ctx, |c| {
            service::chapter::Chapter::get_by_novel_id(self.0.id, &self.0.site_id, c)
        })
        .map(|v| Some(v.into_iter().map(Chapter).collect()))
    }
    async fn collections(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        with_conn(ctx, |c| {
            service::collection::Collection::many_by_novel_id(self.0.id, c)
        })
        .map(|v| Some(v.into_iter().map(Collection).collect()))
    }
    async fn word_count(&self, ctx: &Context<'_>) -> Result<Option<bigdecimal::BigDecimal>> {
        with_conn(ctx, |c| {
            ChapterModel::get_word_count_by_novel_id(self.0.id, c)
        })
        .map(Some)
    }
    async fn read_percentage(&self, ctx: &Context<'_>) -> Result<Option<f64>> {
        with_conn(ctx, |c| {
            ReadRecordModel::read_percentage_by_novel_id(self.0.id, c)
        })
        .map(Some)
    }
    async fn last_chapter(&self, ctx: &Context<'_>) -> Result<Option<Chapter>> {
        with_conn(ctx, |c| {
            ChapterModel::get_last_chapter_by_novel_id(self.0.id, c)
        })
        .map(|v| v.map(|v| Chapter(service::chapter::Chapter::from(v, self.0.site_id.clone()))))
    }
    async fn first_chapter(&self, ctx: &Context<'_>) -> Result<Option<Chapter>> {
        with_conn(ctx, |c| {
            ChapterModel::get_first_chapter_by_novel_id(self.0.id, c)
        })
        .map(|v| v.map(|v| Chapter(service::chapter::Chapter::from(v, self.0.site_id.clone()))))
    }
    async fn comments(&self, ctx: &Context<'_>) -> Result<Option<NovelComment>> {
        with_conn(ctx, |c| NovelCommentModel::find_by_novel_id(self.0.id, c))
            .map(|v| v.map(|v| NovelComment(v.into())))
    }
    async fn url(&self) -> String {
        match self.0.site {
            crate::model::schema::custom_type::NovelSite::Qidian => {
                QDNovel::get_url_from_id(&self.0.site_id)
            }
            crate::model::schema::custom_type::NovelSite::Jjwxc => {
                JJNovel::get_url_from_id(&self.0.site_id)
            }
        }
    }
}
graphql_common::list!(Novel);
pub(crate) struct NovelComment(pub service::novel_comment::NovelComment);
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
