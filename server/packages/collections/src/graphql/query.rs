/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-20 16:24:41
 * @FilePath: /self-tools/server/packages/collections/src/graphql/query.rs
 */
use super::{guard::AuthGuard, types::CollectionItemQuery};
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::PgPool,
    service::{
        collection::{Collection, CollectionQueryRunner, ItemAndCollectionList},
        item::{Item, ItemList, ItemQueryRunner, ItemRunner},
    },
};
use async_graphql::{Context, Object};
use graphql_common::{Pagination, QueryStack, Queryable, TagMatch, TagMatchValidator};
use tracing::{Level, event};

pub(crate) struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取所有集合
    #[graphql(guard = "AuthGuard")]
    async fn all_collections(&self, context: &Context<'_>) -> GraphqlResult<Vec<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let directory = Collection::all_collections(conn)?;
        Ok(directory)
    }
    /// 获取目录详情
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let collection = Collection::get(id, conn)?;
        Ok(collection)
    }
    /// 获取记录详情
    #[graphql(guard = "AuthGuard")]
    async fn get_item(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Item> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let item = Item::get(id, conn)?;
        Ok(item)
    }
    /// 获取集合下的集合和记录
    #[graphql(guard = "AuthGuard")]
    async fn collection_and_item(
        &self,
        context: &Context<'_>,
        query: CollectionItemQuery,
    ) -> GraphqlResult<ItemAndCollectionList> {
        let conn = context.data::<PgPool>().map_err(|_| {
            event!(Level::WARN, "graphql context data PgPool 不存在");
            GraphqlError::NotGraphqlContextData("PgPool")
        })?;
        let (collection_runner, item_runner) = tokio::try_join!(
            CollectionQueryRunner::new(query, conn.clone()),
            ItemQueryRunner::new(query, conn.clone()),
        )?;
        let runner = QueryStack::new(collection_runner).add_query(item_runner);
        let (data, total) = tokio::try_join!(runner.query(query.pagination), runner.len())?;
        Ok(ItemAndCollectionList::new(data, total))
    }
    /// 获取条目列表
    #[graphql(guard = "AuthGuard")]
    async fn query_items(
        &self,
        context: &Context<'_>,
        #[graphql(validator(custom = "TagMatchValidator"))] collection_match: Option<TagMatch>,
        pagination: Pagination,
    ) -> GraphqlResult<ItemList> {
        let conn = context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .clone();
        let runner = ItemRunner::new(collection_match, conn)?;
        let (data, total) = tokio::try_join!(runner.query(pagination), runner.len())?;
        Ok(ItemList::new(data, total))
    }
}
