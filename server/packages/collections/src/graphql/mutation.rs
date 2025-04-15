/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-20 16:24:35
 * @FilePath: /self-tools/server/packages/collections/src/graphql/mutation.rs
 */
use async_graphql::Object;

use super::{guard::AuthGuard, validator::DirNameValidator};
use crate::{
    errors::GraphqlResult,
    service::{collection::Collection, item::Item},
};

pub(crate) struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    #[graphql(guard = "AuthGuard")]
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
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let deleted_directory = Collection::delete(id)?;
        Ok(deleted_directory)
    }
    /// 修改目录
    #[graphql(guard = "AuthGuard")]
    async fn update_collection(
        &self,
        id: i64,
        name: String,
        description: Option<String>,
    ) -> GraphqlResult<Collection> {
        let updated_directory = Collection::update(id, &name, description.as_deref())?;
        Ok(updated_directory)
    }
    /// 创建记录
    #[graphql(guard = "AuthGuard")]
    async fn create_item(
        &self,
        name: String,
        content: String,
        collection_id: i64,
    ) -> GraphqlResult<Item> {
        Item::create(name, content, collection_id)
    }
    /// 删除记录
    #[graphql(guard = "AuthGuard")]
    async fn delete_item(&self, id: i64) -> GraphqlResult<Item> {
        let deleted_item = Item::delete(id)?;
        Ok(deleted_item)
    }
    /// 修改记录
    #[graphql(guard = "AuthGuard")]
    async fn update_item(&self, id: i64, name: String, content: String) -> GraphqlResult<Item> {
        let updated_item = Item::update(id, &name, &content)?;
        Ok(updated_item)
    }
}
