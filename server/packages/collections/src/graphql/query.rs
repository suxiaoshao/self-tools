use async_graphql::Object;

use crate::{
    errors::GraphqlResult,
    service::{collection::Collection, item::Item},
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
    /// 获记录列表
    async fn query_items(&self, collection_id: i64) -> GraphqlResult<Vec<Item>> {
        let item = Item::query(collection_id)?;
        Ok(item)
    }
    /// 获取记录详情
    async fn get_item(&self, id: i64) -> GraphqlResult<Item> {
        let item = Item::get(id)?;
        Ok(item)
    }
}
