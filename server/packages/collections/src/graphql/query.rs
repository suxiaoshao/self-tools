/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-20 16:24:41
 * @FilePath: /self-tools/server/packages/collections/src/graphql/query.rs
 */
use async_graphql::Object;

use super::{
    guard::AuthGuard,
    types::{CollectionItemQuery, ItemAndCollection, List},
};
use crate::{
    common::{QueryStack, Queryable},
    errors::GraphqlResult,
    service::{
        collection::{Collection, CollectionQueryRunner},
        item::{Item, ItemQueryRunner},
    },
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录详情
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let collection = Collection::get(id)?;
        Ok(collection)
    }
    /// 获取记录详情
    #[graphql(guard = "AuthGuard")]
    async fn get_item(&self, id: i64) -> GraphqlResult<Item> {
        let item = Item::get(id)?;
        Ok(item)
    }
    /// 获取集合下的集合和记录
    #[graphql(guard = "AuthGuard")]
    async fn collection_and_item(
        &self,
        query: CollectionItemQuery,
    ) -> GraphqlResult<List<ItemAndCollection>> {
        let (collection_runner, item_runner) = tokio::try_join!(
            CollectionQueryRunner::new(query),
            ItemQueryRunner::new(query),
        )?;
        let runner = QueryStack::new(collection_runner).add_query(item_runner);
        let (data, total) = tokio::try_join!(runner.query(query.pagination), runner.len())?;
        Ok(List::new(data, total))
    }
}
