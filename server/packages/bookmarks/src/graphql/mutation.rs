use super::{
    enums::NovelSite,
    error::{pool, project, write},
    guard::AuthGuard,
    input::*,
    results::*,
};
use crate::service::{
    author::Author, collection::Collection, novel::Novel, novel_comment::NovelComment, tag::Tag,
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
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> Result<CollectionWriteResult> {
        write(
            ctx,
            |conn| Collection::update(id, &name, parent_id, description.as_deref(), conn),
            |v| {
                CollectionWriteResult::CollectionSaved(CollectionSaved {
                    collection_id: v.id,
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn create_author(
        &self,
        ctx: &Context<'_>,
        name: String,
        avatar: String,
        description: String,
        site: NovelSite,
        site_id: String,
    ) -> Result<AuthorWriteResult> {
        write(
            ctx,
            |conn| Author::create(&name, &avatar, &description, site.into(), &site_id, conn),
            |v| AuthorWriteResult::AuthorSaved(AuthorSaved { author_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn create_tag(
        &self,
        ctx: &Context<'_>,
        name: String,
        site: NovelSite,
        site_id: String,
    ) -> Result<TagWriteResult> {
        write(
            ctx,
            |conn| Tag::create(&name, site.into(), &site_id, conn),
            |v| TagWriteResult::TagSaved(TagSaved { tag_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn create_novel(
        &self,
        ctx: &Context<'_>,
        data: CreateNovelInput,
    ) -> Result<NovelWriteResult> {
        write(
            ctx,
            |conn| crate::service::novel::CreateNovelInput::from(data).create(conn),
            |v| NovelWriteResult::NovelSaved(NovelSaved { novel_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn save_draft_author(
        &self,
        ctx: &Context<'_>,
        author: SaveDraftAuthor,
    ) -> Result<AuthorWriteResult> {
        write(
            ctx,
            |conn| crate::service::save_draft::SaveDraftAuthor::from(author).save(conn),
            |v| AuthorWriteResult::AuthorSaved(AuthorSaved { author_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn save_draft_novel(
        &self,
        ctx: &Context<'_>,
        novel: SaveDraftNovel,
    ) -> Result<NovelWriteResult> {
        write(
            ctx,
            |conn| crate::service::save_draft::SaveDraftNovel::from(novel).save(conn),
            |v| NovelWriteResult::NovelSaved(NovelSaved { novel_id: v.id }),
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
    async fn delete_author(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        write(
            ctx,
            |conn| Author::delete(id, conn),
            |v| {
                DeleteResult::ResourceDeleted(ResourceDeleted {
                    resource: ResourceRef {
                        kind: ResourceKind::Author,
                        id: v,
                    },
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_novel(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        write(
            ctx,
            |conn| Novel::delete(id, conn),
            |v| {
                DeleteResult::ResourceDeleted(ResourceDeleted {
                    resource: ResourceRef {
                        kind: ResourceKind::Novel,
                        id: v,
                    },
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_tag(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        write(
            ctx,
            |conn| Tag::delete(id, conn),
            |v| {
                DeleteResult::ResourceDeleted(ResourceDeleted {
                    resource: ResourceRef {
                        kind: ResourceKind::Tag,
                        id: v,
                    },
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_comment_for_novel(
        &self,
        ctx: &Context<'_>,
        novel_id: i64,
    ) -> Result<DeleteResult> {
        write(
            ctx,
            |conn| NovelComment::delete(novel_id, conn),
            |v| {
                DeleteResult::ResourceDeleted(ResourceDeleted {
                    resource: ResourceRef {
                        kind: ResourceKind::Comment,
                        id: v,
                    },
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn add_comment_for_novel(
        &self,
        ctx: &Context<'_>,
        novel_id: i64,
        content: String,
    ) -> Result<CommentWriteResult> {
        write(
            ctx,
            |conn| NovelComment::create(novel_id, &content, conn),
            |v| CommentWriteResult::CommentSaved(CommentSaved { novel_id: v }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn update_comment_for_novel(
        &self,
        ctx: &Context<'_>,
        novel_id: i64,
        content: String,
    ) -> Result<CommentWriteResult> {
        write(
            ctx,
            |conn| NovelComment::update(novel_id, &content, conn),
            |v| CommentWriteResult::CommentSaved(CommentSaved { novel_id: v }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn add_collection_for_novel(
        &self,
        ctx: &Context<'_>,
        collection_id: i64,
        novel_id: i64,
    ) -> Result<AddMembershipResult> {
        write(
            ctx,
            |conn| Novel::add_collection(collection_id, novel_id, conn),
            |_| {
                AddMembershipResult::CollectionMembershipChanged(CollectionMembershipChanged {
                    collection_id,
                    resource: ResourceRef {
                        kind: ResourceKind::Novel,
                        id: novel_id,
                    },
                    present: true,
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection_for_novel(
        &self,
        ctx: &Context<'_>,
        collection_id: i64,
        novel_id: i64,
    ) -> Result<RemoveMembershipResult> {
        write(
            ctx,
            |conn| Novel::delete_collection(collection_id, novel_id, conn),
            |_| {
                RemoveMembershipResult::CollectionMembershipChanged(CollectionMembershipChanged {
                    collection_id,
                    resource: ResourceRef {
                        kind: ResourceKind::Novel,
                        id: novel_id,
                    },
                    present: false,
                })
            },
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn update_novel_by_crawler(
        &self,
        ctx: &Context<'_>,
        novel_id: i64,
    ) -> Result<NovelWriteResult> {
        let result = Novel::refresh(novel_id, pool(ctx)?.clone()).await;
        project(ctx, result, |v| {
            NovelWriteResult::NovelSaved(NovelSaved { novel_id: v.id })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn update_author_by_crawler(
        &self,
        ctx: &Context<'_>,
        author_id: i64,
    ) -> Result<AuthorWriteResult> {
        let result = Author::refresh(author_id, pool(ctx)?.clone()).await;
        project(ctx, result, |v| {
            AuthorWriteResult::AuthorSaved(AuthorSaved { author_id: v.id })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn add_read_records_for_chapter(
        &self,
        ctx: &Context<'_>,
        novel_id: i64,
        chapter_ids: Vec<i64>,
    ) -> Result<AddReadRecordsResult> {
        write(
            ctx,
            |conn| Novel::add_read_records(novel_id, &chapter_ids, conn),
            |v| AddReadRecordsResult::ReadRecordsUpdated(v.into()),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_read_records_for_chapter(
        &self,
        ctx: &Context<'_>,
        chapter_ids: Vec<i64>,
    ) -> Result<DeleteReadRecordsResult> {
        write(
            ctx,
            |conn| Novel::delete_read_records(&chapter_ids, conn),
            |v| DeleteReadRecordsResult::ReadRecordsUpdated(v.into()),
        )
    }
}
