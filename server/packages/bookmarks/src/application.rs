/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 14:26:04
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/mod.rs
 */
mod author;
mod chapter;
mod collection;
mod novel;
mod novel_comment;
mod save_draft;
mod tag;

/// All writes share a short transaction lock because several domain relationships lack FKs.
/// External fetching happens before this lock. Reads remain concurrent.
fn write<T>(
    conn: &mut diesel::PgConnection,
    f: impl FnOnce(&mut diesel::PgConnection) -> crate::errors::AppResult<T>,
) -> crate::errors::AppResult<T> {
    use diesel::{Connection, RunQueryDsl};
    conn.transaction(|conn| {
  diesel::sql_query("LOCK TABLE author, chapter, collection, collection_novel, novel, novel_comment, read_record, tag IN SHARE ROW EXCLUSIVE MODE").execute(conn)?;
  f(conn)
 })
}

mod crawler;
mod domain;
mod refresh;
#[cfg(test)]
mod tests;
use crate::errors::*;
pub(crate) use author::Author;
pub(crate) use chapter::Chapter;
pub(crate) use collection::Collection;
pub(crate) use crawler::{DraftAuthor, DraftChapter, DraftNovel, DraftTag};
pub(crate) use domain::{NovelSite, NovelStatus};
pub(crate) use novel::{CreateNovelInput, Novel, ReadRecordsUpdated};
pub(crate) use novel_comment::NovelComment;
pub(crate) use save_draft::{
    SaveAuthorInfo, SaveChapterInfo, SaveDraftAuthor, SaveDraftNovel, SaveNovelInfo, SaveTagInfo,
};
use service_db::{Database, PgPool};
use service_query::{PageRange, Paginate, TagFilter};
use std::sync::Arc;
pub(crate) use tag::Tag;
mod repository;
pub(crate) struct Application {
    database: Database,
    auth: thrift::AuthEndpoint,
    crawler: Arc<dyn crawler::Crawler>,
}

fn auth_endpoint() -> thrift::AuthEndpoint {
    thrift::AuthEndpoint::new(
        "auth:80".into(),
        service_health::budget::AUTH_DNS,
        service_health::budget::AUTH_RPC,
    )
}

impl Application {
    pub(crate) fn connect() -> anyhow::Result<Arc<Self>> {
        let pool = repository::get_pool()
            .map_err(|_| anyhow::anyhow!("bookmarks database unavailable"))?;
        service_health::database::check(
            &mut *pool
                .get()
                .map_err(|_| anyhow::anyhow!("database unavailable"))?,
            crate::MIGRATIONS,
        )?;
        Ok(Self::new(pool, auth_endpoint()))
    }
    fn new(pool: PgPool, auth: thrift::AuthEndpoint) -> Arc<Self> {
        Arc::new(Self {
            database: Database::new(pool),
            auth,
            crawler: Arc::new(crawler::Sites),
        })
    }
    pub(crate) async fn authenticate(
        &self,
        token: String,
    ) -> Result<(), service_errors::PublicError> {
        self.auth.authenticate(token).await
    }
    async fn database_ready(&self) -> bool {
        matches!(
            tokio::time::timeout(
                service_health::budget::DATABASE,
                self.database.run("bookmarks_ready", |conn| {
                    service_health::database::check(conn, crate::MIGRATIONS).map_err(|e| {
                        service_errors::Fault {
                            kind: service_errors::FaultKind::Database,
                            operation: "bookmarks_schema",
                            source: e.into(),
                        }
                    })
                })
            )
            .await,
            Ok(Ok(()))
        )
    }
    pub(crate) async fn ready(&self) -> bool {
        let (database, auth) = tokio::join!(self.database_ready(), self.auth.ready());
        database && auth
    }
    pub(crate) async fn create_collection(
        &self,
        name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> AppResult<Collection> {
        self.database
            .run("create_collection", move |c| {
                Collection::create(&name, parent_id, description, c)
            })
            .await
    }
    pub(crate) async fn update_collection(
        &self,
        id: i64,
        name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> AppResult<Collection> {
        self.database
            .run("update_collection", move |c| {
                Collection::update(id, &name, parent_id, description.as_deref(), c)
            })
            .await
    }
    pub(crate) async fn create_author(
        &self,
        name: String,
        avatar: String,
        description: String,
        site: NovelSite,
        site_id: String,
    ) -> AppResult<Author> {
        self.database
            .run("create_author", move |c| {
                Author::create(&name, &avatar, &description, site, &site_id, c)
            })
            .await
    }
    pub(crate) async fn create_tag(
        &self,
        name: String,
        site: NovelSite,
        site_id: String,
    ) -> AppResult<Tag> {
        self.database
            .run("create_tag", move |c| Tag::create(&name, site, &site_id, c))
            .await
    }
    pub(crate) async fn create_novel(&self, data: CreateNovelInput) -> AppResult<Novel> {
        self.database
            .run("create_novel", move |c| data.create(c))
            .await
    }
    pub(crate) async fn save_draft_author(&self, author: SaveDraftAuthor) -> AppResult<Author> {
        self.database
            .run("save_draft_author", move |c| author.save(c))
            .await
    }
    pub(crate) async fn save_draft_novel(&self, novel: SaveDraftNovel) -> AppResult<Novel> {
        self.database
            .run("save_draft_novel", move |c| novel.save(c))
            .await
    }
    pub(crate) async fn delete_collection(&self, id: i64) -> AppResult<i64> {
        self.database
            .run("delete_collection", move |c| Collection::delete(id, c))
            .await
    }
    pub(crate) async fn delete_author(&self, id: i64) -> AppResult<i64> {
        self.database
            .run("delete_author", move |c| Author::delete(id, c))
            .await
    }
    pub(crate) async fn delete_novel(&self, id: i64) -> AppResult<i64> {
        self.database
            .run("delete_novel", move |c| Novel::delete(id, c))
            .await
    }
    pub(crate) async fn delete_tag(&self, id: i64) -> AppResult<i64> {
        self.database
            .run("delete_tag", move |c| Tag::delete(id, c))
            .await
    }
    pub(crate) async fn delete_comment_for_novel(&self, novel_id: i64) -> AppResult<i64> {
        self.database
            .run("delete_comment_for_novel", move |c| {
                NovelComment::delete(novel_id, c)
            })
            .await
    }
    pub(crate) async fn add_comment_for_novel(
        &self,
        novel_id: i64,
        content: String,
    ) -> AppResult<i64> {
        self.database
            .run("add_comment_for_novel", move |c| {
                NovelComment::create(novel_id, &content, c)
            })
            .await
    }
    pub(crate) async fn update_comment_for_novel(
        &self,
        novel_id: i64,
        content: String,
    ) -> AppResult<i64> {
        self.database
            .run("update_comment_for_novel", move |c| {
                NovelComment::update(novel_id, &content, c)
            })
            .await
    }
    pub(crate) async fn add_collection_for_novel(
        &self,
        collection_id: i64,
        novel_id: i64,
    ) -> AppResult<()> {
        self.database
            .run("add_collection_for_novel", move |c| {
                Novel::add_collection(collection_id, novel_id, c)
            })
            .await
    }
    pub(crate) async fn delete_collection_for_novel(
        &self,
        collection_id: i64,
        novel_id: i64,
    ) -> AppResult<()> {
        self.database
            .run("delete_collection_for_novel", move |c| {
                Novel::delete_collection(collection_id, novel_id, c)
            })
            .await
    }
    pub(crate) async fn add_read_records_for_chapter(
        &self,
        novel_id: i64,
        chapter_ids: Vec<i64>,
    ) -> AppResult<ReadRecordsUpdated> {
        self.database
            .run("add_read_records_for_chapter", move |c| {
                Novel::add_read_records(novel_id, &chapter_ids, c)
            })
            .await
    }
    pub(crate) async fn delete_read_records_for_chapter(
        &self,
        chapter_ids: Vec<i64>,
    ) -> AppResult<ReadRecordsUpdated> {
        self.database
            .run("delete_read_records_for_chapter", move |c| {
                Novel::delete_read_records(&chapter_ids, c)
            })
            .await
    }
    pub(crate) async fn all_collections(&self) -> AppResult<Vec<Collection>> {
        self.database
            .run("all_collections", Collection::all_collections)
            .await
    }
    pub(crate) async fn all_tags(&self) -> AppResult<Vec<Tag>> {
        self.database.run("all_tags", Tag::all).await
    }
    pub(crate) async fn all_authors(&self, search_name: Option<String>) -> AppResult<Vec<Author>> {
        self.database
            .run("all_authors", move |c| {
                match search_name.filter(|s| !s.is_empty()) {
                    Some(name) => Author::search(name, c),
                    None => Author::all(c),
                }
            })
            .await
    }
    pub(crate) async fn get_collection(&self, id: i64) -> AppResult<Option<Collection>> {
        self.database
            .run("get_collection", move |c| detail(Collection::get(id, c)))
            .await
    }

    pub(crate) async fn query_collections(
        &self,
        parent_id: Option<i64>,
        page: PageRange,
    ) -> AppResult<(Vec<Collection>, i64)> {
        self.database
            .run("query_collections", move |c| {
                c.build_transaction()
                    .read_only()
                    .repeatable_read()
                    .run(|c| {
                        if let Some(id) = parent_id {
                            validate_id(id, "parentId")?;
                            Collection::get(id, c)?;
                        }
                        let total =
                            repository::collection::CollectionModel::get_count(parent_id, c)?;
                        let data =
                            repository::collection::CollectionModel::list_by_parent_with_page(
                                parent_id,
                                page.offset(),
                                page.limit(),
                                c,
                            )?;
                        Ok((data.into_iter().map(Into::into).collect(), total))
                    })
            })
            .await
    }
    pub(crate) async fn query_authors(
        &self,
        search_name: Option<String>,
        page: PageRange,
    ) -> AppResult<(Vec<Author>, i64)> {
        self.database
            .run("query_authors", move |c| {
                c.build_transaction()
                    .read_only()
                    .repeatable_read()
                    .run(|c| {
                        use repository::author::AuthorModel;
                        let (data, total) = match search_name.filter(|s| !s.is_empty()) {
                            Some(name) => (
                                AuthorModel::search_list_with_page(
                                    &name,
                                    page.offset(),
                                    page.limit(),
                                    c,
                                )?,
                                AuthorModel::get_search_count(&name, c)?,
                            ),
                            None => (
                                AuthorModel::list_with_page(page.offset(), page.limit(), c)?,
                                AuthorModel::get_count(c)?,
                            ),
                        };
                        Ok((data.into_iter().map(Into::into).collect(), total))
                    })
            })
            .await
    }
    pub(crate) async fn query_tags(&self, page: PageRange) -> AppResult<(Vec<Tag>, i64)> {
        self.database
            .run("query_tags", move |c| {
                c.build_transaction()
                    .read_only()
                    .repeatable_read()
                    .run(|c| {
                        use repository::tag::TagModel;
                        let total = TagModel::count(c)?;
                        let data =
                            TagModel::get_list_by_pagination(page.offset(), page.limit(), c)?;
                        Ok((data.into_iter().map(Into::into).collect(), total))
                    })
            })
            .await
    }
    pub(crate) async fn query_novels(
        &self,
        collections: Option<TagFilter>,
        tags: Option<TagFilter>,
        status: Option<NovelStatus>,
        page: PageRange,
    ) -> AppResult<(Vec<Novel>, i64)> {
        self.database
            .run("query_novels", move |c| {
                c.build_transaction()
                    .read_only()
                    .repeatable_read()
                    .run(|c| repository::query::page(collections, tags, status, page, c))
            })
            .await
    }
}
fn detail<T>(result: AppResult<T>) -> AppResult<Option<T>> {
    match result {
        Ok(value) => Ok(Some(value)),
        Err(service_errors::UseCaseError::Rejected(Rejection::Missing(_))) => Ok(None),
        Err(error) => Err(error),
    }
}

pub(crate) mod read;
