use async_graphql::Object;

use super::{
    guard::AuthGuard,
    input::{ItemAndCollection, Pagination},
};
use crate::{
    errors::{GraphqlError, GraphqlResult},
    service::{collection::Collection, item::Item},
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录详情
    #[graphql(guard = "AuthGuard::default()")]
    async fn get_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let collection = Collection::get(id)?;
        Ok(collection)
    }
    /// 获取记录详情
    #[graphql(guard = "AuthGuard::default()")]
    async fn get_item(&self, id: i64) -> GraphqlResult<Item> {
        let item = Item::get(id)?;
        Ok(item)
    }
    /// 获取集合下的集合和记录
    #[graphql(guard = "AuthGuard::default()")]
    async fn collection_and_item(
        &self,
        id: Option<i64>,
        pagination: Pagination,
    ) -> GraphqlResult<Vec<ItemAndCollection>> {
        let offset = pagination.offset();
        let offset_plus_imit = pagination.offset_plus_limit();
        let collection_count = Collection::count_parent_id(id)?;
        // 全目录
        if offset_plus_imit <= collection_count {
            let data = Collection::get_list_parent_id(id, offset, pagination.page_size)?
                .into_iter()
                .map(ItemAndCollection::Collection)
                .collect();
            return Ok(data);
        }
        // 目录 & 记录
        if offset < collection_count && collection_count < offset_plus_imit {
            let mut data = vec![];
            Collection::get_list_parent_id(id, offset, collection_count - offset)?
                .into_iter()
                .for_each(|x| data.push(ItemAndCollection::Collection(x)));
            if let Some(id) = id {
                Item::query(id, 0, offset_plus_imit - collection_count)?
                    .into_iter()
                    .for_each(|x| data.push(ItemAndCollection::Item(x)));
            }
            return Ok(data);
        }
        // 全记录
        let id = match id {
            Some(id) => id,
            None => {
                return Err(GraphqlError::PageSizeTooMore);
            }
        };
        let item_count = Item::count(id)?;
        if collection_count + item_count < offset {
            return Err(GraphqlError::PageSizeTooMore);
        }
        let data = Item::query(id, offset - collection_count, pagination.page_size)?
            .into_iter()
            .map(ItemAndCollection::Item)
            .collect();
        Ok(data)
    }
}
