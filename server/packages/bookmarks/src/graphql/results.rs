use crate::errors::Rejection;
use async_graphql::{Enum, SimpleObject, Union};
use graphql_common::ValidationFailure;
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub(crate) enum ResourceKind {
    Collection,
    Author,
    Tag,
    Novel,
    Chapter,
    Comment,
}
impl From<crate::errors::ResourceKind> for ResourceKind {
    fn from(v: crate::errors::ResourceKind) -> Self {
        match v {
            crate::errors::ResourceKind::Collection => Self::Collection,
            crate::errors::ResourceKind::Author => Self::Author,
            crate::errors::ResourceKind::Tag => Self::Tag,
            crate::errors::ResourceKind::Novel => Self::Novel,
            crate::errors::ResourceKind::Chapter => Self::Chapter,
            crate::errors::ResourceKind::Comment => Self::Comment,
        }
    }
}
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub(crate) enum ConflictReason {
    #[graphql(name = "COLLECTION_PATH_EXISTS")]
    CollectionPath,
    #[graphql(name = "SOURCE_ID_EXISTS")]
    SourceId,
    #[graphql(name = "MEMBERSHIP_EXISTS")]
    Membership,
    #[graphql(name = "COMMENT_EXISTS")]
    Comment,
}
impl From<crate::errors::ConflictReason> for ConflictReason {
    fn from(v: crate::errors::ConflictReason) -> Self {
        match v {
            crate::errors::ConflictReason::CollectionPath => Self::CollectionPath,
            crate::errors::ConflictReason::SourceId => Self::SourceId,
            crate::errors::ConflictReason::Membership => Self::Membership,
            crate::errors::ConflictReason::Comment => Self::Comment,
        }
    }
}
#[derive(SimpleObject)]
pub(crate) struct ResourceRef {
    pub kind: ResourceKind,
    pub id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct MissingResources {
    pub resources: Vec<ResourceRef>,
}
#[derive(SimpleObject)]
pub(crate) struct Conflict {
    pub reason: ConflictReason,
    pub resources: Vec<ResourceRef>,
}
#[derive(SimpleObject)]
pub(crate) struct ResourceDeleted {
    pub resource: ResourceRef,
}
#[derive(SimpleObject)]
pub(crate) struct CollectionSaved {
    pub collection_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct AuthorSaved {
    pub author_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct TagSaved {
    pub tag_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct NovelSaved {
    pub novel_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct CommentSaved {
    pub novel_id: i64,
}
#[derive(SimpleObject)]
pub(crate) struct CollectionMembershipChanged {
    pub collection_id: i64,
    pub resource: ResourceRef,
    pub present: bool,
}
#[derive(SimpleObject)]
pub(crate) struct ChaptersAlreadyRead {
    pub chapter_ids: Vec<i64>,
}
#[derive(SimpleObject)]
pub(crate) struct ReadRecordsUpdated {
    pub chapter_ids: Vec<i64>,
    pub changed_count: i64,
}
impl From<crate::errors::ResourceRef> for ResourceRef {
    fn from(v: crate::errors::ResourceRef) -> Self {
        Self {
            kind: v.kind.into(),
            id: v.id,
        }
    }
}
impl From<crate::application::ReadRecordsUpdated> for ReadRecordsUpdated {
    fn from(v: crate::application::ReadRecordsUpdated) -> Self {
        Self {
            chapter_ids: v.chapter_ids,
            changed_count: v.changed_count,
        }
    }
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
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: reason.into(),
                resources: v.into_iter().map(Into::into).collect(),
            })),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum AuthorWriteResult {
    AuthorSaved(AuthorSaved),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
    Conflict(Conflict),
}
impl TryFrom<Rejection> for AuthorWriteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: reason.into(),
                resources: v.into_iter().map(Into::into).collect(),
            })),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum TagWriteResult {
    TagSaved(TagSaved),
    ValidationFailure(ValidationFailure),
    Conflict(Conflict),
}
impl TryFrom<Rejection> for TagWriteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: reason.into(),
                resources: v.into_iter().map(Into::into).collect(),
            })),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum NovelWriteResult {
    NovelSaved(NovelSaved),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
    Conflict(Conflict),
}
impl TryFrom<Rejection> for NovelWriteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: reason.into(),
                resources: v.into_iter().map(Into::into).collect(),
            })),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum CommentWriteResult {
    CommentSaved(CommentSaved),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
    Conflict(Conflict),
}
impl TryFrom<Rejection> for CommentWriteResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: reason.into(),
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
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::Conflict(reason, v) => Ok(Self::Conflict(Conflict {
                reason: reason.into(),
                resources: v.into_iter().map(Into::into).collect(),
            })),
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
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            v => Err(v),
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
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum AddReadRecordsResult {
    ReadRecordsUpdated(ReadRecordsUpdated),
    ValidationFailure(ValidationFailure),
    MissingResources(MissingResources),
    ChaptersAlreadyRead(ChaptersAlreadyRead),
}
impl TryFrom<Rejection> for AddReadRecordsResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            Rejection::Missing(v) => Ok(Self::MissingResources(MissingResources {
                resources: v.into_iter().map(Into::into).collect(),
            })),
            Rejection::AlreadyRead(v) => Ok(Self::ChaptersAlreadyRead(ChaptersAlreadyRead {
                chapter_ids: v,
            })),
            v => Err(v),
        }
    }
}
#[derive(Union)]
pub(crate) enum DeleteReadRecordsResult {
    ReadRecordsUpdated(ReadRecordsUpdated),
    ValidationFailure(ValidationFailure),
}
impl TryFrom<Rejection> for DeleteReadRecordsResult {
    type Error = Rejection;
    fn try_from(v: Rejection) -> Result<Self, Rejection> {
        match v {
            Rejection::Validation(v) => Ok(Self::ValidationFailure(v.into())),
            v => Err(v),
        }
    }
}
