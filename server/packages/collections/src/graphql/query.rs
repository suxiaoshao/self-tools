/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 13:11:36
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
        query: CollectionItemQuery,
    ) -> GraphqlResult<List<ItemAndCollection>> {
        let runner = QueryStack::new(CollectionQueryRunner).add_query(ItemQueryRunner);
        let data = runner.query(&query, query.pagination).await?;
        let total = runner.len(&query).await?;
        Ok(List::new(data, total))
    }
}
