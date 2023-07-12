use async_graphql::Object;
use tracing::{event, Level};

use super::{
    guard::AuthGuard,
    types::{ItemAndCollection, List, Pagination},
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
    ) -> GraphqlResult<List<ItemAndCollection>> {
        let offset = pagination.offset();
        let offset_plus_limit = pagination.offset_plus_limit();
        let collection_count = Collection::count_parent_id(id)?;
        let item_count = match id {
            Some(id) => Item::count(id)?,
            None => 0,
        };
        let total = collection_count + item_count;
        // 全目录
        if offset_plus_limit <= collection_count {
            let data = Collection::get_list_parent_id(id, offset, pagination.page_size)?
                .into_iter()
                .map(ItemAndCollection::Collection)
                .collect();
            return Ok(List::new(data, total));
        }
        // 目录 & 记录
        if offset <= collection_count && collection_count < offset_plus_limit {
            let mut data = vec![];
            Collection::get_list_parent_id(id, offset, collection_count - offset)?
                .into_iter()
                .for_each(|x| data.push(ItemAndCollection::Collection(x)));
            if let Some(id) = id {
                Item::query(id, 0, offset_plus_limit - collection_count)?
                    .into_iter()
                    .for_each(|x| data.push(ItemAndCollection::Item(x)));
            }
            return Ok(List::new(data, total));
        }
        // 全记录
        let id = match id {
            Some(id) => id,
            None => {
                event!(
                    Level::ERROR,
                    "全记录查询时页码太大 pagination: {:?} collection_count + item_count: {}",
                    pagination,
                    collection_count + item_count
                );
                return Err(GraphqlError::PageSizeTooMore);
            }
        };
        if collection_count + item_count < offset {
            event!(
                Level::ERROR,
                "全记录查询时页码太大 pagination: {:?} collection_count + item_count: {}",
                pagination,
                collection_count + item_count
            );
            return Err(GraphqlError::PageSizeTooMore);
        }
        let data = Item::query(id, offset - collection_count, pagination.page_size)?
            .into_iter()
            .map(ItemAndCollection::Item)
            .collect();
        Ok(List::new(data, total))
    }
}
