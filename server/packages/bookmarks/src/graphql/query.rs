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
            .map(|v| v.map(Collection::from))
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_author(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Author>> {
        crate::errors::validate_id(id, "id").map_err(read_error)?;
        Ok(super::loaders::load(ctx, super::loaders::Authors(id))
            .await?
            .map(Author))
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_novel(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Novel>> {
        crate::errors::validate_id(id, "id").map_err(read_error)?;
        Ok(super::loaders::load(ctx, super::loaders::Novels(id))
            .await?
            .map(Novel))
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::list_cost(child_complexity)"
    )]
    async fn all_collections(&self, ctx: &Context<'_>) -> Result<Vec<Collection>> {
        application(ctx)?
            .all_collections()
            .await
            .map(|v| v.into_iter().map(Collection::from).collect())
            .map_err(read_error)
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::list_cost(child_complexity)"
    )]
    async fn all_tags(&self, ctx: &Context<'_>) -> Result<Vec<Tag>> {
        application(ctx)?
            .all_tags()
            .await
            .map(|v| v.into_iter().map(Tag::from).collect())
            .map_err(read_error)
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::list_cost(child_complexity)"
    )]
    async fn all_authors(
        &self,
        ctx: &Context<'_>,
        search_name: Option<String>,
    ) -> Result<Vec<Author>> {
        application(ctx)?
            .all_authors(search_name)
            .await
            .map(|v| v.into_iter().map(Author::from).collect())
            .map_err(read_error)
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::page_cost(pagination.page_size, child_complexity)"
    )]
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
            data.into_iter().map(Collection::from).collect(),
            total,
        ))
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::page_cost(pagination.page_size, child_complexity)"
    )]
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
        if ctx.look_ahead().field("data").field("novels").exists() {
            super::loaders::prefetch(ctx, data.iter().map(|v| super::loaders::AuthorNovels(v.id)))
                .await;
        }
        Ok(AuthorList::new(
            data.into_iter().map(Author::from).collect(),
            total,
        ))
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::page_cost(pagination.page_size, child_complexity)"
    )]
    async fn query_tags(&self, ctx: &Context<'_>, pagination: Pagination) -> Result<TagList> {
        let (data, total) = application(ctx)?
            .query_tags(page(pagination)?)
            .await
            .map_err(read_error)?;
        Ok(TagList::new(
            data.into_iter().map(Tag::from).collect(),
            total,
        ))
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::page_cost(pagination.page_size, child_complexity)"
    )]
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
        let data: Vec<_> = data.into_iter().map(std::sync::Arc::new).collect();
        super::loaders::novels(ctx, &data, ctx.look_ahead().field("data")).await;
        Ok(NovelList::new(data.into_iter().map(Novel).collect(), total))
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::fetch_cost(child_complexity)"
    )]
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
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::fetch_cost(child_complexity)"
    )]
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
