use crate::graphql::loaders;
use crate::{
    application::{Collection as CollectionData, Item as ItemData},
    errors::Rejection,
};
use async_graphql::{Context, Enum, Object, Result, SimpleObject, Union};
use graphql_common::{DateTime, ValidationFailure};
#[derive(Clone)]
pub(crate) struct Collection(pub std::sync::Arc<CollectionData>);
#[Object]
impl Collection {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn name(&self) -> &str {
        &self.0.name
    }
    async fn path(&self) -> &str {
        &self.0.path
    }
    async fn parent_id(&self) -> Option<i64> {
        self.0.parent_id
    }
    async fn description(&self) -> Option<&str> {
        self.0.description.as_deref()
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn ancestors(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        Ok(Some(
            loaders::ancestors(ctx, self.0.id)
                .await?
                .into_iter()
                .map(Collection)
                .collect(),
        ))
    }
}
#[derive(Clone)]
pub(crate) struct Item(pub std::sync::Arc<ItemData>);
#[Object]
impl Item {
    async fn id(&self) -> i64 {
        self.0.id
    }
    async fn name(&self) -> &str {
        &self.0.name
    }
    async fn content(&self) -> &str {
        &self.0.content
    }
    async fn create_time(&self) -> DateTime {
        self.0.create_time.into()
    }
    async fn update_time(&self) -> DateTime {
        self.0.update_time.into()
    }
    #[graphql(complexity = "graphql_common::cost::list_cost(child_complexity)")]
    async fn collections(&self, ctx: &Context<'_>) -> Result<Option<Vec<Collection>>> {
        Ok(Some(
            loaders::load(ctx, loaders::ItemCollections(self.0.id))
                .await?
                .unwrap_or_default()
                .into_iter()
                .map(Collection)
                .collect(),
        ))
    }
}
#[derive(Union)]
pub(crate) enum ItemAndCollection {
    Item(Item),
    Collection(Collection),
}
impl From<crate::application::input::ItemAndCollection> for ItemAndCollection {
    fn from(v: crate::application::input::ItemAndCollection) -> Self {
        match v {
            crate::application::input::ItemAndCollection::Item(v) => Self::Item(Item::from(v)),
            crate::application::input::ItemAndCollection::Collection(v) => {
                Self::Collection(Collection::from(v))
            }
        }
    }
}
graphql_common::list!(ItemAndCollection);
graphql_common::list!(Item);
#[derive(Enum, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ResourceKind {
    Collection,
    Item,
}
#[derive(Enum, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ConflictReason {
    CollectionPathExists,
    MembershipExists,
}
#[derive(SimpleObject)]
pub(crate) struct ResourceRef {
    pub kind: ResourceKind,
    pub id: i64,
}
impl From<crate::errors::ResourceRef> for ResourceRef {
    fn from(v: crate::errors::ResourceRef) -> Self {
        Self {
            kind: match v.kind {
                crate::errors::ResourceKind::Collection => ResourceKind::Collection,
                crate::errors::ResourceKind::Item => ResourceKind::Item,
            },
            id: v.id,
        }
    }
}
#[derive(SimpleObject)]
pub(crate) struct MissingResources {
    resources: Vec<ResourceRef>,
}
#[derive(SimpleObject)]
pub(crate) struct Conflict {
    reason: ConflictReason,
    resources: Vec<ResourceRef>,
}
#[derive(SimpleObject)]
pub(crate) struct ResourceDeleted {
    pub resource: ResourceRef,
}
/// A committed collection identifier; no fallible post-write reads.
#[derive(SimpleObject)]
pub(crate) struct CollectionSaved {
    pub collection_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct ItemSaved {
    pub item_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct CollectionMembershipChanged {
    pub collection_id: i64,
    pub resource: ResourceRef,
    pub present: bool,
}
#[derive(Union)]
pub(crate) enum CollectionWriteResult {
    CollectionSaved(CollectionSaved),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
    Conflict(Conflict),
}
impl TryFrom<Rejection> for CollectionWriteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> std::result::Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: match reason {
                    crate::errors::ConflictReason::CollectionPathExists => {
                        ConflictReason::CollectionPathExists
                    }
                    crate::errors::ConflictReason::MembershipExists => {
                        ConflictReason::MembershipExists
                    }
                },
                resources: v.into_iter().map(Into::into).collect(),
            })),
        }
    }
}
#[derive(Union)]
pub(crate) enum ItemWriteResult {
    ItemSaved(ItemSaved),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
}
impl TryFrom<Rejection> for ItemWriteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> std::result::Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum AddMembershipResult {
    CollectionMembershipChanged(CollectionMembershipChanged),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
    Conflict(Conflict),
}
impl TryFrom<Rejection> for AddMembershipResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> std::result::Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: match reason {
                    crate::errors::ConflictReason::CollectionPathExists => {
                        ConflictReason::CollectionPathExists
                    }
                    crate::errors::ConflictReason::MembershipExists => {
                        ConflictReason::MembershipExists
                    }
                },
                resources: v.into_iter().map(Into::into).collect(),
            })),
        }
    }
}
#[derive(Union)]
pub(crate) enum DeleteResult {
    ResourceDeleted(ResourceDeleted),
    ValidationFailure(ValidationFailure),
}
impl TryFrom<Rejection> for DeleteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> std::result::Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum RemoveMembershipResult {
    CollectionMembershipChanged(CollectionMembershipChanged),
    ValidationFailure(ValidationFailure),
}
impl TryFrom<Rejection> for RemoveMembershipResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> std::result::Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            v => Err(v),
        }
    }
}

impl From<crate::application::Collection> for Collection {
    fn from(v: crate::application::Collection) -> Self {
        Self(std::sync::Arc::new(v))
    }
}

impl From<crate::application::Item> for Item {
    fn from(v: crate::application::Item) -> Self {
        Self(std::sync::Arc::new(v))
    }
}
