/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-04 01:19:36
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/query.rs
 */
use async_graphql::Object;

use crate::{
    errors::GraphqlResult,
    model::schema::custom_type::ReadStatus,
    service::{author::Author, collection::Collection, novel::Novel, tag::Tag},
};

use super::{
    guard::AuthGuard,
    input::{NovelSite, TagMatch},
    output::DraftAuthorInfo,
    validator::TagMatchValidator,
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录列表
    #[graphql(guard = "AuthGuard::default()")]
    async fn get_collections(&self, parent_id: Option<i64>) -> GraphqlResult<Vec<Collection>> {
        let directory = Collection::get_list_parent_id(parent_id)?;
        Ok(directory)
    }
    /// 获取目录详情
    #[graphql(guard = "AuthGuard::default()")]
    async fn get_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let collection = Collection::get(id)?;
        Ok(collection)
    }
    /// 获取作者列表
    #[graphql(guard = "AuthGuard::default()")]
    async fn query_authors(
        &self,
        // 搜索作者名
        search_name: Option<String>,
    ) -> GraphqlResult<Vec<Author>> {
        // 空字符串视为无效
        let search_name = match search_name {
            Some(x) if x.is_empty() => None,
            _ => search_name,
        };
        let author = Author::query(search_name)?;
        Ok(author)
    }
    /// 获取标签列表
    #[graphql(guard = "AuthGuard::default()")]
    async fn query_tags(
        &self,
        collection_id: Option<i64>,
        // 是否深度搜索
        deep_search: Option<bool>,
    ) -> GraphqlResult<Vec<Tag>> {
        let tag = Tag::query(collection_id, deep_search.unwrap_or(false))?;
        Ok(tag)
    }
    /// 获取小说列表
    #[graphql(guard = "AuthGuard::default()")]
    async fn query_novels(
        &self,
        collection_id: Option<i64>,
        #[graphql(validator(custom = "TagMatchValidator"))] tag_match: Option<TagMatch>,
        read_status: Option<ReadStatus>,
    ) -> GraphqlResult<Vec<Novel>> {
        let novel = Novel::query(collection_id, tag_match, read_status)?;
        Ok(novel)
    }
    /// 获取小说详情
    #[graphql(guard = "AuthGuard::default()")]
    async fn get_novel(&self, id: i64) -> GraphqlResult<Novel> {
        let novel = Novel::get(id)?;
        Ok(novel)
    }
    /// 后端 fetch 小说详情
    #[graphql(guard = "AuthGuard::default()")]
    async fn fetch_author(
        &self,
        id: String,
        novel_site: NovelSite,
    ) -> GraphqlResult<DraftAuthorInfo> {
        let author = DraftAuthorInfo::new(id, novel_site).await?;
        Ok(author)
    }
}
