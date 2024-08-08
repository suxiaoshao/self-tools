/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-25 13:55:34
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/query.rs
 */
use async_graphql::{Context, Object};
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        schema::custom_type::{NovelSite, NovelStatus},
        PgPool,
    },
    service::{author::Author, collection::Collection, novel::Novel, tag::Tag},
};

use super::{
    guard::AuthGuard,
    input::TagMatch,
    output::{DraftAuthorInfo, DraftNovelInfo},
    validator::TagMatchValidator,
};

pub(crate) struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录列表
    #[graphql(guard = "AuthGuard")]
    async fn get_collections(
        &self,
        context: &Context<'_>,
        parent_id: Option<i64>,
    ) -> GraphqlResult<Vec<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let directory = Collection::get_list_parent_id(parent_id, conn)?;
        Ok(directory)
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
        let author = Author::query(search_name, conn)?;
        Ok(author)
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
    /// 获取标签列表
    #[graphql(guard = "AuthGuard")]
    async fn query_tags(&self, context: &Context<'_>) -> GraphqlResult<Vec<Tag>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let tag = Tag::query(conn)?;
        Ok(tag)
    }
    /// 获取小说列表
    #[graphql(guard = "AuthGuard")]
    async fn query_novels(
        &self,
        context: &Context<'_>,
        collection_id: Option<i64>,
        #[graphql(validator(custom = "TagMatchValidator"))] tag_match: Option<TagMatch>,
        novel_status: Option<NovelStatus>,
    ) -> GraphqlResult<Vec<Novel>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let novel = Novel::query(collection_id, tag_match, novel_status, conn)?;
        Ok(novel)
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
