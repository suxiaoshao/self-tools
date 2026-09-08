use super::{error::write, guard::AuthGuard, types::*};
use crate::service::{collection::Collection, item::Item};
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
        write(
            ctx,
            |conn| Collection::create(&name, parent_id, description, conn),
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
        write(
            ctx,
            |conn| Collection::update(id, &name, description.as_deref(), conn),
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
        write(
            ctx,
            |conn| Item::create(name, content, collection_ids, conn),
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
        write(
            ctx,
            |conn| Item::update(id, &name, &content, conn),
            |v| ItemWriteResult::ItemSaved(ItemSaved { item_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        write(
            ctx,
            |conn| Collection::delete(id, conn),
            |v| {
                DeleteResult::ResourceDeleted(ResourceDeleted {
                    resource: ResourceRef {
                        kind: ResourceKind::Collection,
                        id: v,
                    },
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_item(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        write(
            ctx,
            |conn| Item::delete(id, conn),
            |v| {
                DeleteResult::ResourceDeleted(ResourceDeleted {
                    resource: ResourceRef {
                        kind: ResourceKind::Item,
                        id: v,
                    },
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn add_collection_for_item(
        &self,
        ctx: &Context<'_>,
        collection_id: i64,
        item_id: i64,
    ) -> Result<AddMembershipResult> {
        write(
            ctx,
            |conn| Item::add_collection(collection_id, item_id, conn),
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
        write(
            ctx,
            |conn| Item::delete_collection(collection_id, item_id, conn),
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
