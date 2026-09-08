use diesel::PgConnection;

use time::OffsetDateTime;

use crate::{
    errors::AppResult,
    model::{
        novel::NovelModel,
        novel_comment::{NewNovelComment, NovelCommentModel},
    },
};

#[derive(Clone)]
pub(crate) struct NovelComment {
    pub(crate) content: String,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
}

impl From<NovelCommentModel> for NovelComment {
    fn from(
        NovelCommentModel {
            create_time,
            update_time,
            content,
            ..
        }: NovelCommentModel,
    ) -> Self {
        Self {
            content,
            create_time,
            update_time,
        }
    }
}

impl NovelComment {
    pub(crate) fn create(novel_id: i64, content: &str, conn: &mut PgConnection) -> AppResult<i64> {
        use crate::errors::*;
        validate_id(novel_id, "novelId")?;
        super::write(conn, |conn| {
            if !NovelModel::exists(novel_id, conn)? {
                return Err(missing(ResourceKind::Novel, novel_id));
            }
            if NovelCommentModel::exist_by_novel_id(novel_id, conn)? {
                return Err(conflict(
                    ConflictReason::Comment,
                    vec![ResourceRef {
                        kind: ResourceKind::Comment,
                        id: novel_id,
                    }],
                ));
            }
            let now = OffsetDateTime::now_utc();
            let author_id = NovelModel::find_one(novel_id, conn)?.author_id;
            NewNovelComment::new(novel_id, author_id, content, now, now).create(conn)?;
            Ok(novel_id)
        })
    }
    pub(crate) fn delete(novel_id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        crate::errors::validate_id(novel_id, "novelId")?;
        super::write(conn, |conn| {
            if NovelCommentModel::exist_by_novel_id(novel_id, conn)? {
                NovelCommentModel::delete_by_novel_id(novel_id, conn)?;
            }
            Ok(novel_id)
        })
    }
    pub(crate) fn update(novel_id: i64, content: &str, conn: &mut PgConnection) -> AppResult<i64> {
        use crate::errors::*;
        validate_id(novel_id, "novelId")?;
        super::write(conn, |conn| {
            if !NovelCommentModel::exist_by_novel_id(novel_id, conn)? {
                return Err(missing(ResourceKind::Comment, novel_id));
            }
            NovelCommentModel::update(novel_id, content, OffsetDateTime::now_utc(), conn)?;
            Ok(novel_id)
        })
    }
}
