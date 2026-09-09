use super::{
    error::{application, project},
    guard::AuthGuard,
    types::*,
};
use async_graphql::{Context, Object, Result};
pub(crate) struct MutationRoot;
#[Object]
impl MutationRoot {
    #[graphql(guard = "AuthGuard")]
    async fn create_collection(
        &self,
        ctx: &Context<'_>,
        name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> Result<CollectionWriteResult> {
        project(
            ctx,
            application(ctx)?
                .create_collection(name, parent_id, description)
                .await,
            |v| {
                CollectionWriteResult::CollectionSaved(CollectionSaved {
                    collection_id: v.id,
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn update_collection(
        &self,
        ctx: &Context<'_>,
        id: i64,
        name: String,
        description: Option<String>,
    ) -> Result<CollectionWriteResult> {
        project(
            ctx,
            application(ctx)?
                .update_collection(id, name, description)
                .await,
            |v| {
                CollectionWriteResult::CollectionSaved(CollectionSaved {
                    collection_id: v.id,
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn create_item(
        &self,
        ctx: &Context<'_>,
        name: String,
        content: String,
        collection_ids: Vec<i64>,
    ) -> Result<ItemWriteResult> {
        project(
            ctx,
            application(ctx)?
                .create_item(name, content, collection_ids)
                .await,
            |v| ItemWriteResult::ItemSaved(ItemSaved { item_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn update_item(
        &self,
        ctx: &Context<'_>,
        id: i64,
        name: String,
        content: String,
    ) -> Result<ItemWriteResult> {
        project(
            ctx,
            application(ctx)?.update_item(id, name, content).await,
            |v| ItemWriteResult::ItemSaved(ItemSaved { item_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        project(ctx, application(ctx)?.delete_collection(id).await, |v| {
            DeleteResult::ResourceDeleted(ResourceDeleted {
                resource: ResourceRef {
                    kind: ResourceKind::Collection,
                    id: v,
                },
            })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_item(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        project(ctx, application(ctx)?.delete_item(id).await, |v| {
            DeleteResult::ResourceDeleted(ResourceDeleted {
                resource: ResourceRef {
                    kind: ResourceKind::Item,
                    id: v,
                },
            })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn add_collection_for_item(
        &self,
        ctx: &Context<'_>,
        collection_id: i64,
        item_id: i64,
    ) -> Result<AddMembershipResult> {
        project(
            ctx,
            application(ctx)?
                .add_collection_for_item(collection_id, item_id)
                .await,
            |_| {
                AddMembershipResult::CollectionMembershipChanged(CollectionMembershipChanged {
                    collection_id,
                    resource: ResourceRef {
                        kind: ResourceKind::Item,
                        id: item_id,
                    },
                    present: true,
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection_for_item(
        &self,
        ctx: &Context<'_>,
        collection_id: i64,
        item_id: i64,
    ) -> Result<RemoveMembershipResult> {
        project(
            ctx,
            application(ctx)?
                .delete_collection_for_item(collection_id, item_id)
                .await,
            |_| {
                RemoveMembershipResult::CollectionMembershipChanged(CollectionMembershipChanged {
                    collection_id,
                    resource: ResourceRef {
                        kind: ResourceKind::Item,
                        id: item_id,
                    },
                    present: false,
                })
            },
        )
    }
}
