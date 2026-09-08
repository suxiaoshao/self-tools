use super::{
    enums::{NovelSite, NovelStatus},
    error::{detail, filter, page, pool, read_error, with_conn},
    guard::AuthGuard,
    objects::*,
    output::{DraftAuthorInfo, DraftNovelInfo},
};
use crate::service::{
    self, author::AuthorRunner, collection::CollectionRunner, novel::NovelRunner, tag::TagRunner,
};
use async_graphql::{Context, Object, Result};
use graphql_common::{Pagination, TagMatch};
use service_query::Queryable;
pub(crate) struct QueryRoot;
#[Object]
impl QueryRoot {
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Collection>> {
        with_conn(ctx, |c| detail(service::collection::Collection::get(id, c)))
            .map(|v| v.map(Collection))
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_author(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Author>> {
        with_conn(ctx, |c| detail(service::author::Author::get(id, c))).map(|v| v.map(Author))
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_novel(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Novel>> {
        with_conn(ctx, |c| detail(service::novel::Novel::get(id, c))).map(|v| v.map(Novel))
    }
    #[graphql(guard = "AuthGuard")]
    async fn all_collections(&self, ctx: &Context<'_>) -> Result<Vec<Collection>> {
        with_conn(ctx, service::collection::Collection::all_collections)
            .map(|v| v.into_iter().map(Collection).collect())
    }
    #[graphql(guard = "AuthGuard")]
    async fn all_tags(&self, ctx: &Context<'_>) -> Result<Vec<Tag>> {
        with_conn(ctx, service::tag::Tag::all).map(|v| v.into_iter().map(Tag).collect())
    }
    #[graphql(guard = "AuthGuard")]
    async fn all_authors(
        &self,
        ctx: &Context<'_>,
        search_name: Option<String>,
    ) -> Result<Vec<Author>> {
        with_conn(ctx, |c| match search_name.filter(|s| !s.is_empty()) {
            Some(name) => service::author::Author::search(name, c),
            None => service::author::Author::all(c),
        })
        .map(|v| v.into_iter().map(Author).collect())
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_collections(
        &self,
        ctx: &Context<'_>,
        parent_id: Option<i64>,
        pagination: Pagination,
    ) -> Result<CollectionList> {
        let pagination = page(pagination)?;
        let runner = CollectionRunner::new(pool(ctx)?.clone(), parent_id).map_err(read_error)?;
        let (data, total) =
            tokio::try_join!(runner.query(pagination), runner.len()).map_err(read_error)?;
        Ok(CollectionList::new(
            data.into_iter().map(Collection).collect(),
            total,
        ))
    }
    #[graphql(guard = "AuthGuard")]
    async fn query_authors(
        &self,
        ctx: &Context<'_>,
        search_name: Option<String>,
        pagination: Pagination,
    ) -> Result<AuthorList> {
        let pagination = page(pagination)?;
        let runner = AuthorRunner::new(pool(ctx)?.clone(), search_name.filter(|s| !s.is_empty()))
            .map_err(read_error)?;
        let (data, total) =
            tokio::try_join!(runner.query(pagination), runner.len()).map_err(read_error)?;
        Ok(AuthorList::new(
            data.into_iter().map(Author).collect(),
            total,
        ))
    }
    #[graphql(guard = "AuthGuard")]
    async fn query_tags(&self, ctx: &Context<'_>, pagination: Pagination) -> Result<TagList> {
        let pagination = page(pagination)?;
        let runner = TagRunner::new(pool(ctx)?.clone()).map_err(read_error)?;
        let (data, total) =
            tokio::try_join!(runner.query(pagination), runner.len()).map_err(read_error)?;
        Ok(TagList::new(data.into_iter().map(Tag).collect(), total))
    }
    #[graphql(guard = "AuthGuard")]
    async fn query_novels(
        &self,
        ctx: &Context<'_>,
        collection_match: Option<TagMatch>,
        tag_match: Option<TagMatch>,
        novel_status: Option<NovelStatus>,
        pagination: Pagination,
    ) -> Result<NovelList> {
        let pagination = page(pagination)?;
        let runner = NovelRunner::new(
            filter(collection_match, "collectionMatch")?,
            filter(tag_match, "tagMatch")?,
            novel_status.map(Into::into),
            pool(ctx)?.clone(),
        )
        .map_err(read_error)?;
        let (data, total) =
            tokio::try_join!(runner.query(pagination), runner.len()).map_err(read_error)?;
        Ok(NovelList::new(data.into_iter().map(Novel).collect(), total))
    }
    #[graphql(guard = "AuthGuard")]
    async fn fetch_author(&self, id: String, novel_site: NovelSite) -> Result<DraftAuthorInfo> {
        if id.is_empty() || !id.bytes().all(|c| c.is_ascii_digit()) {
            return Err(read_error(crate::errors::invalid(
                "id",
                service_errors::ValidationCode::InvalidFormat,
            )));
        }
        DraftAuthorInfo::new(id, novel_site).await
    }
    #[graphql(guard = "AuthGuard")]
    async fn fetch_novel(&self, id: String, novel_site: NovelSite) -> Result<DraftNovelInfo> {
        if id.is_empty() || !id.bytes().all(|c| c.is_ascii_digit()) {
            return Err(read_error(crate::errors::invalid(
                "id",
                service_errors::ValidationCode::InvalidFormat,
            )));
        }
        DraftNovelInfo::new(id, novel_site).await
    }
}
