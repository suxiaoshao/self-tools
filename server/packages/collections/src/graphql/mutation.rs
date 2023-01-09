use async_graphql::Object;

use super::{guard::AuthGuard, validator::DirNameValidator};
use crate::{
    errors::GraphqlResult,
    service::{collection::Collection, item::Item},
};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    #[graphql(guard = "AuthGuard::default()")]
    async fn create_collection(
        &self,
        #[graphql(validator(custom = "DirNameValidator"))] name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> GraphqlResult<Collection> {
        let new_directory = Collection::create(&name, parent_id, description)?;
        Ok(new_directory)
    }
    /// 删除目录
    #[graphql(guard = "AuthGuard::default()")]
    async fn delete_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let deleted_directory = Collection::delete(id)?;
        Ok(deleted_directory)
    }
    /// 修改目录
    #[graphql(guard = "AuthGuard::default()")]
    async fn update_collection(
        &self,
        id: i64,
        name: String,
        description: String,
    ) -> GraphqlResult<Collection> {
        let updated_directory = Collection::update(id, &name, &description)?;
        Ok(updated_directory)
    }
    /// 创建记录
    #[graphql(guard = "AuthGuard::default()")]
    async fn create_item(
        &self,
        name: String,
        content: String,
        collection_id: i64,
    ) -> GraphqlResult<Item> {
        Item::create(name, content, collection_id)
    }
    /// 删除记录
    #[graphql(guard = "AuthGuard::default()")]
    async fn delete_item(&self, id: i64) -> GraphqlResult<Item> {
        let deleted_item = Item::delete(id)?;
        Ok(deleted_item)
    }
    /// 修改小说
    async fn update_item(&self, id: i64, name: String, content: String) -> GraphqlResult<Item> {
        let updated_item = Item::update(id, &name, &content)?;
        Ok(updated_item)
    }
}
