use super::{
    error::{application, read_error},
    guard::AuthGuard,
    types::*,
};
use async_graphql::{Context, Object, Result};
use graphql_common::{Pagination, TagMatch};
use service_query::TagFilter;
pub(crate) struct QueryRoot;
#[Object]
impl QueryRoot {
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::list_cost(child_complexity)"
    )]
    async fn all_collections(&self, ctx: &Context<'_>) -> Result<Vec<Collection>> {
        application(ctx)?
            .all_collections()
            .await
            .map(|v| v.into_iter().map(Collection::from).collect())
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_collection(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Collection>> {
        application(ctx)?
            .get_collection(id)
            .await
            .map(|v| v.map(Collection::from))
            .map_err(read_error)
    }
    #[graphql(guard = "AuthGuard")]
    async fn get_item(&self, ctx: &Context<'_>, id: i64) -> Result<Option<Item>> {
        application(ctx)?
            .get_item(id)
            .await
            .map(|v| v.map(Item::from))
            .map_err(read_error)
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::page_cost(query.pagination.page_size, child_complexity)"
    )]
    async fn collection_and_item(
        &self,
        ctx: &Context<'_>,
        query: CollectionItemQuery,
    ) -> Result<ItemAndCollectionList> {
        let query = query.checked()?;
        let (data, total) = application(ctx)?
            .collection_and_item(query)
            .await
            .map_err(read_error)?;
        Ok(ItemAndCollectionList::new(
            data.into_iter().map(Into::into).collect(),
            total,
        ))
    }
    #[graphql(
        guard = "AuthGuard",
        complexity = "graphql_common::cost::page_cost(pagination.page_size, child_complexity)"
    )]
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

        let filter = collection_match.map(|v| TagFilter {
            match_set: v.match_set,
            full_match: v.full_match,
        });
        let (data, total) = application(ctx)?
            .query_items(filter, pagination)
            .await
            .map_err(read_error)?;
        if ctx.look_ahead().field("data").field("collections").exists() {
            super::loaders::prefetch(
                ctx,
                data.iter().map(|v| super::loaders::ItemCollections(v.id)),
            )
            .await;
        }
        Ok(ItemList::new(
            data.into_iter().map(Item::from).collect(),
            total,
        ))
    }
}
