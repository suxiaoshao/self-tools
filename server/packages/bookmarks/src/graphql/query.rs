use std::collections::HashSet;

use async_graphql::Object;

use crate::{
    errors::GraphqlResult,
    service::{author::Author, collection::Collection, novel::Novel, tag::Tag},
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录列表
    async fn get_collections(&self, parent_id: Option<i64>) -> GraphqlResult<Vec<Collection>> {
        let directory = Collection::get_list_parent_id(parent_id)?;
        Ok(directory)
    }
    /// 获取目录详情
    async fn get_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let collection = Collection::get(id)?;
        Ok(collection)
    }
    /// 获取作者列表
    async fn get_authors(&self) -> GraphqlResult<Vec<Author>> {
        let author = Author::get_list()?;
        Ok(author)
    }
    /// 获取标签列表
    async fn get_tags(&self, collection_id: Option<i64>) -> GraphqlResult<Vec<Tag>> {
        let tag = Tag::get_list(collection_id)?;
        Ok(tag)
    }
    /// 获取小说列表
    async fn query_novels(
        &self,
        collection_id: i64,
        tags: HashSet<i64>,
        tag_full_match: bool,
    ) -> GraphqlResult<Vec<Novel>> {
        let novel = Novel::query(collection_id, tags, tag_full_match)?;
        Ok(novel)
    }
    /// 获取小说详情
    async fn get_novel(&self, id: i64) -> GraphqlResult<Novel> {
        let novel = Novel::get(id)?;
        Ok(novel)
    }
}
