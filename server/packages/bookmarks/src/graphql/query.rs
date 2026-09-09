use super::{
    enums::{NovelSite, NovelStatus},
    error::{application, filter, page, read_error},
    guard::AuthGuard,
    objects::*,
    output::{DraftAuthorInfo, DraftNovelInfo},
};
use async_graphql::{Context, Object, Result};
use graphql_common::{Pagination, TagMatch};

pub(crate) struct QueryRoot;
#[Object]
impl QueryRoot {
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Collection>> {
        application(ctx)?
            .get_collection(id)
            .await
            .map(|v| v.map(Collection))
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_author(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Author>> {
        application(ctx)?
            .get_author(id)
            .await
            .map(|v| v.map(Author))
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_novel(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Novel>> {
        application(ctx)?
            .get_novel(id)
            .await
            .map(|v| v.map(Novel))
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn all_collections(&self, ctx: &Context<'_>) -> Result<Vec<Collection>> {
        application(ctx)?
            .all_collections()
            .await
            .map(|v| v.into_iter().map(Collection).collect())
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn all_tags(&self, ctx: &Context<'_>) -> Result<Vec<Tag>> {
        application(ctx)?
            .all_tags()
            .await
            .map(|v| v.into_iter().map(Tag).collect())
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn all_authors(
        &self,
        ctx: &Context<'_>,
        search_name: Option<String>,
    ) -> Result<Vec<Author>> {
        application(ctx)?
            .all_authors(search_name)
            .await
            .map(|v| v.into_iter().map(Author).collect())
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_collections(
        &self,
        ctx: &Context<'_>,
        parent_id: Option<i64>,
        pagination: Pagination,
    ) -> Result<CollectionList> {
        let (data, total) = application(ctx)?
            .query_collections(parent_id, page(pagination)?)
            .await
            .map_err(read_error)?;
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
        let (data, total) = application(ctx)?
            .query_authors(search_name, page(pagination)?)
            .await
            .map_err(read_error)?;
        Ok(AuthorList::new(
            data.into_iter().map(Author).collect(),
            total,
        ))
    }
    #[graphql(guard = "AuthGuard")]
    async fn query_tags(&self, ctx: &Context<'_>, pagination: Pagination) -> Result<TagList> {
        let (data, total) = application(ctx)?
            .query_tags(page(pagination)?)
            .await
            .map_err(read_error)?;
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
        let (data, total) = application(ctx)?
            .query_novels(
                filter(collection_match, "collectionMatch")?,
                filter(tag_match, "tagMatch")?,
                novel_status.map(Into::into),
                pagination,
            )
            .await
            .map_err(read_error)?;
        Ok(NovelList::new(data.into_iter().map(Novel).collect(), total))
    }
    #[graphql(guard = "AuthGuard")]
    async fn fetch_author(
        &self,
        ctx: &Context<'_>,
        id: String,
        novel_site: NovelSite,
    ) -> Result<DraftAuthorInfo> {
        application(ctx)?
            .fetch_author(id, novel_site.into())
            .await
            .map(DraftAuthorInfo)
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn fetch_novel(
        &self,
        ctx: &Context<'_>,
        id: String,
        novel_site: NovelSite,
    ) -> Result<DraftNovelInfo> {
        application(ctx)?
            .fetch_novel(id, novel_site.into())
            .await
            .map(DraftNovelInfo)
            .map_err(read_error)
    }
}
