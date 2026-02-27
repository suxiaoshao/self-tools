/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-25 13:55:34
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/query.rs
 */
use super::{
    guard::AuthGuard,
    output::{DraftAuthorInfo, DraftNovelInfo},
};
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        PgPool,
        schema::custom_type::{NovelSite, NovelStatus},
    },
    service::{
        author::{Author, AuthorList, AuthorRunner},
        collection::{Collection, CollectionList, CollectionRunner},
        novel::{Novel, NovelList, NovelRunner},
        tag::{Tag, TagList, TagRunner},
    },
};
use async_graphql::{Context, Object};
use graphql_common::{Pagination, Queryable, TagMatch, TagMatchValidator};
use tracing::{Level, event};

pub(crate) struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取所有集合
    #[graphql(guard = "AuthGuard")]
    async fn all_collections(&self, context: &Context<'_>) -> GraphqlResult<Vec<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let directory = Collection::all_collections(conn)?;
        Ok(directory)
    }
    /// 获取目录列表
    #[graphql(guard = "AuthGuard")]
    async fn get_collections(
        &self,
        context: &Context<'_>,
        parent_id: Option<i64>,
        pagination: Pagination,
    ) -> GraphqlResult<CollectionList> {
        let conn = context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .clone();
        let runner = CollectionRunner::new(conn, parent_id)?;
        let (data, total) = tokio::try_join!(runner.query(pagination), runner.len())?;
        Ok(CollectionList::new(data, total))
    }
    /// 获取目录详情
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let collection = Collection::get(id, conn)?;
        Ok(collection)
    }
    /// 获取作者列表
    #[graphql(guard = "AuthGuard")]
    async fn query_authors(
        &self,
        context: &Context<'_>,
        // 搜索作者名
        search_name: Option<String>,
        pagination: Pagination,
    ) -> GraphqlResult<AuthorList> {
        let conn = context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .clone();
        // 空字符串视为无效
        let search_name = match search_name {
            Some(x) if x.is_empty() => None,
            _ => search_name,
        };
        let runner = AuthorRunner::new(conn, search_name)?;
        let (data, total) = tokio::try_join!(runner.query(pagination), runner.len())?;
        Ok(AuthorList::new(data, total))
    }
    /// 获取作者详情
    #[graphql(guard = "AuthGuard")]
    async fn get_author(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let author = Author::get(id, conn)?;
        Ok(author)
    }
    /// 获取所有作者
    #[graphql(guard = "AuthGuard")]
    async fn all_authors(
        &self,
        context: &Context<'_>,
        search_name: Option<String>,
    ) -> GraphqlResult<Vec<Author>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        // 空字符串视为无效
        let search_name = match search_name {
            Some(x) if x.is_empty() => None,
            _ => search_name,
        };
        match search_name {
            Some(name) => {
                let data = Author::search(name, conn)?;
                Ok(data)
            }
            None => {
                let data = Author::all(conn)?;
                Ok(data)
            }
        }
    }
    /// 获取标签列表
    #[graphql(guard = "AuthGuard")]
    async fn query_tags(
        &self,
        context: &Context<'_>,
        pagination: Pagination,
    ) -> GraphqlResult<TagList> {
        let conn = context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .clone();
        let tag = TagRunner::new(conn)?;
        let (data, total) = tokio::try_join!(tag.query(pagination), tag.len())?;
        Ok(TagList::new(data, total))
    }
    /// 获取所有 tag
    #[graphql(guard = "AuthGuard")]
    async fn all_tags(&self, context: &Context<'_>) -> GraphqlResult<Vec<Tag>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let tags = Tag::all(conn)?;
        Ok(tags)
    }
    /// 获取小说列表
    #[graphql(guard = "AuthGuard")]
    async fn query_novels(
        &self,
        context: &Context<'_>,
        #[graphql(validator(custom = "TagMatchValidator"))] collection_match: Option<TagMatch>,
        #[graphql(validator(custom = "TagMatchValidator"))] tag_match: Option<TagMatch>,
        novel_status: Option<NovelStatus>,
        pagination: Pagination,
    ) -> GraphqlResult<NovelList> {
        let conn = context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .clone();
        let novel = NovelRunner::new(collection_match, tag_match, novel_status, conn)?;
        let (data, total) = tokio::try_join!(novel.query(pagination), novel.len())?;
        Ok(NovelList::new(data, total))
    }
    /// 获取小说详情
    #[graphql(guard = "AuthGuard")]
    async fn get_novel(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let novel = Novel::get(id, conn)?;
        Ok(novel)
    }
    /// 后端 fetch 作者详情
    #[graphql(guard = "AuthGuard")]
    async fn fetch_author(
        &self,
        id: String,
        novel_site: NovelSite,
    ) -> GraphqlResult<DraftAuthorInfo> {
        let author = DraftAuthorInfo::new(id, novel_site).await?;
        Ok(author)
    }
    /// 后端 fetch 小说详情
    #[graphql(guard = "AuthGuard")]
    async fn fetch_novel(
        &self,
        id: String,
        novel_site: NovelSite,
    ) -> GraphqlResult<DraftNovelInfo> {
        let novel = DraftNovelInfo::new(id, novel_site).await?;
        Ok(novel)
    }
}
