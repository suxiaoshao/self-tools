use super::{NovelSite, NovelStatus};
use crate::application::repository::author::AuthorModel;
use crate::application::repository::chapter::ChapterModel;
use crate::application::repository::collection_novel::CollectionNovelModel;

use crate::application::repository::novel::{NewNovel, NovelModel};
use crate::application::repository::read_record::{NewReadRecord, ReadRecordModel};
use crate::application::repository::{collection::CollectionModel, tag::TagModel};
use crate::errors::AppResult;

use diesel::PgConnection;

use std::collections::HashSet;
use time::OffsetDateTime;

#[derive(Clone)]
pub(crate) struct Novel {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) avatar: String,
    pub(crate) description: String,
    pub(crate) author_id: i64,
    pub(crate) novel_status: NovelStatus,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
}

impl From<NovelModel> for Novel {
    fn from(value: NovelModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            author_id: value.author_id,
            avatar: value.avatar,
            description: value.description,
            create_time: value.create_time,
            update_time: value.update_time,
            novel_status: value.novel_status.into(),
            site: value.site.into(),
            site_id: value.site_id,
        }
    }
}

impl Novel {
    /// 删除小说
    pub(super) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        crate::errors::validate_id(id, "id")?;
        super::write(conn, |conn| {
            delete_records(id, conn)?;
            Ok(id)
        })
    }

    /// 获取小说
    pub(super) fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        crate::errors::validate_id(id, "id")?;
        if !NovelModel::exists(id, conn)? {
            return Err(crate::errors::missing(
                crate::errors::ResourceKind::Novel,
                id,
            ));
        }
        let novel = NovelModel::find_one(id, conn)?;
        Ok(novel.into())
    }
}

/// collection_id 相关
impl Novel {
    /// 添加集合
    pub(super) fn add_collection(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        use crate::errors::*;
        validate_id(collection_id, "collectionId")?;
        validate_id(novel_id, "novelId")?;
        super::write(conn, |conn| {
            let mut resources = vec![];
            if !CollectionModel::exists(collection_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Collection,
                    id: collection_id,
                });
            }
            if !NovelModel::exists(novel_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Novel,
                    id: novel_id,
                });
            }
            if !resources.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    resources,
                )));
            }
            if CollectionNovelModel::exists(collection_id, novel_id, conn)? {
                return Err(conflict(
                    ConflictReason::Membership,
                    vec![
                        ResourceRef {
                            kind: ResourceKind::Collection,
                            id: collection_id,
                        },
                        ResourceRef {
                            kind: ResourceKind::Novel,
                            id: novel_id,
                        },
                    ],
                ));
            }
            CollectionNovelModel::save(collection_id, novel_id, conn)
        })
    }
    /// 删除
    pub(super) fn delete_collection(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        crate::errors::validate_id(collection_id, "collectionId")?;
        crate::errors::validate_id(novel_id, "novelId")?;
        CollectionNovelModel::delete(collection_id, novel_id, conn)
    }
}

/// chapter id 相关
impl Novel {
    /// 添加阅读记录
    pub(super) fn add_read_records(
        novel_id: i64,
        chapter_ids: &[i64],
        conn: &mut PgConnection,
    ) -> AppResult<ReadRecordsUpdated> {
        use crate::errors::*;
        validate_id(novel_id, "novelId")?;
        let chapter_ids = checked_chapter_ids(chapter_ids)?;
        if chapter_ids.is_empty() {
            return Ok(ReadRecordsUpdated {
                chapter_ids,
                changed_count: 0,
            });
        }
        super::write(conn, |conn| {
            if !NovelModel::exists(novel_id, conn)? {
                return Err(missing(ResourceKind::Novel, novel_id));
            }
            let requested = chapter_ids.iter().copied().collect::<HashSet<_>>();
            let all = ChapterModel::get_chapter_ids(novel_id, conn)?
                .into_iter()
                .collect::<HashSet<_>>();
            let missing = requested
                .difference(&all)
                .map(|id| ResourceRef {
                    kind: ResourceKind::Chapter,
                    id: *id,
                })
                .collect::<Vec<_>>();
            if !missing.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    missing,
                )));
            }
            let read = ReadRecordModel::read_chapter_ids_by_novel_id(novel_id, conn)?
                .into_iter()
                .collect::<HashSet<_>>();
            let mut already = requested.intersection(&read).copied().collect::<Vec<_>>();
            already.sort_unstable();
            if !already.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(
                    Rejection::AlreadyRead(already),
                ));
            }
            let now = OffsetDateTime::now_utc();
            let records = chapter_ids
                .iter()
                .map(|id| NewReadRecord::new(novel_id, *id, now))
                .collect::<Vec<_>>();
            let changed_count = NewReadRecord::create_many(&records, conn)? as i64;
            Ok(ReadRecordsUpdated {
                chapter_ids,
                changed_count,
            })
        })
    }
    /// 删除阅读记录
    pub(super) fn delete_read_records(
        chapter_ids: &[i64],
        conn: &mut PgConnection,
    ) -> AppResult<ReadRecordsUpdated> {
        let chapter_ids = checked_chapter_ids(chapter_ids)?;
        let changed_count = ReadRecordModel::delete_by_chapter_ids(&chapter_ids, conn)? as i64;
        Ok(ReadRecordsUpdated {
            chapter_ids,
            changed_count,
        })
    }
}

pub(crate) struct CreateNovelInput {
    pub(crate) name: String,
    pub(crate) avatar: String,
    pub(crate) description: String,
    pub(crate) author_id: i64,
    pub(crate) novel_status: NovelStatus,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) tags: HashSet<i64>,
}

impl CreateNovelInput {
    pub(super) fn create(self, conn: &mut PgConnection) -> AppResult<Novel> {
        use crate::errors::*;
        validate_id(self.author_id, "data.authorId")?;
        for id in &self.tags {
            validate_id(*id, "data.tags")?;
        }
        super::write(conn, |conn| {
            let mut resources = vec![];
            if !AuthorModel::exists(self.author_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Author,
                    id: self.author_id,
                });
            }
            for id in &self.tags {
                if !TagModel::exists(*id, conn)? {
                    resources.push(ResourceRef {
                        kind: ResourceKind::Tag,
                        id: *id,
                    });
                }
            }
            if !resources.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    resources,
                )));
            }
            Ok(self.to_new_novel().create(conn)?.into())
        })
        .map_err(source_conflict)
    }
    fn to_new_novel(&self) -> NewNovel<'_> {
        let now = time::OffsetDateTime::now_utc();
        let CreateNovelInput {
            name,
            avatar,
            description,
            author_id,
            novel_status,
            site,
            site_id,
            tags,
        } = self;
        let tags = tags.iter().copied().collect::<Vec<_>>();
        NewNovel {
            name,
            avatar,
            description,
            author_id: *author_id,
            novel_status: (*novel_status).into(),
            site: (*site).into(),
            site_id,
            tags,
            create_time: now,
            update_time: now,
        }
    }
}

pub(crate) struct ReadRecordsUpdated {
    pub chapter_ids: Vec<i64>,
    pub changed_count: i64,
}
fn checked_chapter_ids(ids: &[i64]) -> AppResult<Vec<i64>> {
    for (index, id) in ids.iter().enumerate() {
        crate::errors::validate_id(*id, &format!("chapterIds.{index}"))?;
    }
    let mut ids = ids.to_vec();
    ids.sort_unstable();
    ids.dedup();
    Ok(ids)
}

pub(super) fn delete_records(id: i64, conn: &mut PgConnection) -> AppResult<()> {
    use crate::application::repository::schema::{novel_comment, read_record};
    use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
    if !NovelModel::exists(id, conn)? {
        return Ok(());
    }
    diesel::delete(read_record::table.filter(read_record::novel_id.eq(id))).execute(conn)?;
    diesel::delete(novel_comment::table.filter(novel_comment::novel_id.eq(id))).execute(conn)?;
    CollectionNovelModel::delete_by_novel_id(id, conn)?;
    ChapterModel::delete_by_novel_id(id, conn)?;
    NovelModel::delete(id, conn)?;
    Ok(())
}
