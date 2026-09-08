use super::{
    error::{detail, pool, read_error, with_conn},
    guard::AuthGuard,
    types::*,
};
use crate::service::{
    collection::{Collection as CollectionService, CollectionQueryRunner},
    item::{Item as ItemService, ItemQueryRunner, ItemRunner},
};
use async_graphql::{Context, Object, Result};
use graphql_common::{Pagination, TagMatch};
use service_query::{QueryStack, Queryable, TagFilter};
pub(crate) struct QueryRoot;
#[Object]
impl QueryRoot {
    #[graphql(guard = "AuthGuard")]
    async fn all_collections(&self, ctx: &Context<'_>) -> Result<Vec<Collection>> {
        with_conn(ctx, CollectionService::all_collections)
            .map(|v| v.into_iter().map(Collection).collect())
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Collection>> {
        with_conn(ctx, |conn| detail(CollectionService::get(id, conn))).map(|v| v.map(Collection))
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_item(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Item>> {
        with_conn(ctx, |conn| detail(ItemService::get(id, conn))).map(|v| v.map(Item))
    }
    #[graphql(guard = "AuthGuard")]
    async fn collection_and_item(
        &self,
        ctx: &Context<'_>,
        query: CollectionItemQuery,
    ) -> Result<ItemAndCollectionList> {
        let query = query.checked()?;
        if let Some(id) = query.id {
            crate::errors::validate_id(id, "query.id").map_err(read_error)?;
        }
        let conn = pool(ctx)?;
        let (collections, items) = tokio::try_join!(
            CollectionQueryRunner::new(query, conn.clone()),
            ItemQueryRunner::new(query, conn.clone())
        )
        .map_err(read_error)?;
        let runner = QueryStack::new(collections).add_query(items);
        let (data, total) =
            tokio::try_join!(runner.query(query.pagination), runner.len()).map_err(read_error)?;
        Ok(ItemAndCollectionList::new(
            data.into_iter().map(Into::into).collect(),
            total,
        ))
    }
    #[graphql(guard = "AuthGuard")]
    async fn query_items(
        &self,
        ctx: &Context<'_>,
        collection_match: Option<TagMatch>,
        pagination: Pagination,
    ) -> Result<ItemList> {
        let pagination = pagination.checked().map_err(|mut v| {
            v.path.insert(0, "pagination".into());
            graphql_common::invalid_fields(vec![v])
        })?;
        if let Some(filter) = &collection_match {
            if filter.match_set.is_empty() {
                return Err(graphql_common::invalid_fields(vec![
                    service_errors::FieldViolation {
                        path: vec!["collectionMatch".into(), "matchSet".into()],
                        code: service_errors::ValidationCode::Required,
                        min: Some(1),
                        max: None,
                    },
                ]));
            }
            for id in &filter.match_set {
                crate::errors::validate_id(*id, "collectionMatch.matchSet").map_err(read_error)?;
            }
        }
        let runner = ItemRunner::new(
            collection_match.map(|v| TagFilter {
                match_set: v.match_set,
                full_match: v.full_match,
            }),
            pool(ctx)?.clone(),
        )
        .map_err(read_error)?;
        let (data, total) =
            tokio::try_join!(runner.query(pagination), runner.len()).map_err(read_error)?;
        Ok(ItemList::new(data.into_iter().map(Item).collect(), total))
    }
}
