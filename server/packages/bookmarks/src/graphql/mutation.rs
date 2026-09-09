use super::{
    enums::NovelSite,
    error::{application, project},
    guard::AuthGuard,
    input::*,
    results::*,
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
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> Result<CollectionWriteResult> {
        project(
            ctx,
            application(ctx)?
                .update_collection(id, name, parent_id, description)
                .await,
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
        project(
            ctx,
            application(ctx)?
                .create_author(name, avatar, description, site.into(), site_id)
                .await,
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
        project(
            ctx,
            application(ctx)?
                .create_tag(name, site.into(), site_id)
                .await,
            |v| TagWriteResult::TagSaved(TagSaved { tag_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn create_novel(
        &self,
        ctx: &Context<'_>,
        data: CreateNovelInput,
    ) -> Result<NovelWriteResult> {
        project(
            ctx,
            application(ctx)?.create_novel(data.into()).await,
            |v| NovelWriteResult::NovelSaved(NovelSaved { novel_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn save_draft_author(
        &self,
        ctx: &Context<'_>,
        author: SaveDraftAuthor,
    ) -> Result<AuthorWriteResult> {
        project(
            ctx,
            application(ctx)?.save_draft_author(author.into()).await,
            |v| AuthorWriteResult::AuthorSaved(AuthorSaved { author_id: v.id }),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn save_draft_novel(
        &self,
        ctx: &Context<'_>,
        novel: SaveDraftNovel,
    ) -> Result<NovelWriteResult> {
        project(
            ctx,
            application(ctx)?.save_draft_novel(novel.into()).await,
            |v| NovelWriteResult::NovelSaved(NovelSaved { novel_id: v.id }),
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
    async fn delete_author(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        project(ctx, application(ctx)?.delete_author(id).await, |v| {
            DeleteResult::ResourceDeleted(ResourceDeleted {
                resource: ResourceRef {
                    kind: ResourceKind::Author,
                    id: v,
                },
            })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_novel(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        project(ctx, application(ctx)?.delete_novel(id).await, |v| {
            DeleteResult::ResourceDeleted(ResourceDeleted {
                resource: ResourceRef {
                    kind: ResourceKind::Novel,
                    id: v,
                },
            })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_tag(&self, ctx: &Context<'_>, id: i64) -> Result<DeleteResult> {
        project(ctx, application(ctx)?.delete_tag(id).await, |v| {
            DeleteResult::ResourceDeleted(ResourceDeleted {
                resource: ResourceRef {
                    kind: ResourceKind::Tag,
                    id: v,
                },
            })
        })
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_comment_for_novel(
        &self,
        ctx: &Context<'_>,
        novel_id: i64,
    ) -> Result<DeleteResult> {
        project(
            ctx,
            application(ctx)?.delete_comment_for_novel(novel_id).await,
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
        project(
            ctx,
            application(ctx)?
                .add_comment_for_novel(novel_id, content)
                .await,
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
        project(
            ctx,
            application(ctx)?
                .update_comment_for_novel(novel_id, content)
                .await,
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
        project(
            ctx,
            application(ctx)?
                .add_collection_for_novel(collection_id, novel_id)
                .await,
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
        project(
            ctx,
            application(ctx)?
                .delete_collection_for_novel(collection_id, novel_id)
                .await,
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
        let result = application(ctx)?.refresh_novel(novel_id).await;
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
        let result = application(ctx)?.refresh_author(author_id).await;
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
        project(
            ctx,
            application(ctx)?
                .add_read_records_for_chapter(novel_id, chapter_ids)
                .await,
            |v| AddReadRecordsResult::ReadRecordsUpdated(v.into()),
        )
    }
    #[graphql(guard = "AuthGuard")]
    async fn delete_read_records_for_chapter(
        &self,
        ctx: &Context<'_>,
        chapter_ids: Vec<i64>,
    ) -> Result<DeleteReadRecordsResult> {
        project(
            ctx,
            application(ctx)?
                .delete_read_records_for_chapter(chapter_ids)
                .await,
            |v| DeleteReadRecordsResult::ReadRecordsUpdated(v.into()),
        )
    }
}
