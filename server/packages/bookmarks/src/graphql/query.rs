use async_graphql::Object;

use crate::{
    errors::GraphqlResult,
    service::{author::Author, collection::Collection, tag::Tag},
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录列表
    async fn get_collection_list(&self, parent_id: Option<i64>) -> GraphqlResult<Vec<Collection>> {
        let directory = Collection::get_list_parent_id(parent_id)?;
        Ok(directory)
    }
    /// 获取目录详情
    async fn get_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let collection = Collection::get(id)?;
        Ok(collection)
    }
    /// 获取作者列表
    async fn get_author_list(&self) -> GraphqlResult<Vec<Author>> {
        let author = Author::get_list()?;
        Ok(author)
    }
    /// 获取标签列表
    async fn get_tag_list(&self, collection_id: Option<i64>) -> GraphqlResult<Vec<Tag>> {
        let tag = Tag::get_list(collection_id)?;
        Ok(tag)
    }
}
