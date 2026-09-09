use crate::{application::repository::schema::novel_comment, errors::AppResult};
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Insertable)]
#[diesel(table_name = novel_comment)]
pub(in crate::application) struct NewNovelComment<'a> {
    novel_id: i64,
    author_id: i64,
    content: &'a str,
    create_time: OffsetDateTime,
    update_time: OffsetDateTime,
}

impl NewNovelComment<'_> {
    pub(in crate::application) fn new<'a>(
        novel_id: i64,
        author_id: i64,
        content: &'a str,
        create_time: OffsetDateTime,
        update_time: OffsetDateTime,
    ) -> NewNovelComment<'a> {
        NewNovelComment {
            novel_id,
            author_id,
            content,
            create_time,
            update_time,
        }
    }
    pub(in crate::application) fn create(
        &self,
        conn: &mut PgConnection,
    ) -> AppResult<NovelCommentModel> {
        use crate::application::repository::schema::novel_comment::dsl::*;
        let result = diesel::insert_into(novel_comment)
            .values(self)
            .get_result(conn)?;
        Ok(result)
    }
}

#[derive(Queryable)]
pub(in crate::application) struct NovelCommentModel {
    _id: i64,
    _novel_id: i64,
    _author_id: i64,
    pub(in crate::application) content: String,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

// novel id
impl NovelCommentModel {
    pub(in crate::application) fn find_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Option<Self>> {
        use crate::application::repository::schema::novel_comment;
        let comment = novel_comment::table
            .filter(novel_comment::novel_id.eq(novel_id))
            .first(conn);
        match comment {
            Ok(id) => Ok(Some(id)),
            Err(diesel::NotFound) => Ok(None),
            Err(err) => Err(err.into()),
        }
    }
    pub(in crate::application) fn exist_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<bool> {
        let data = diesel::select(diesel::dsl::exists(
            novel_comment::table.filter(novel_comment::novel_id.eq(novel_id)),
        ))
        .get_result(conn)?;
        Ok(data)
    }
    pub(in crate::application) fn delete_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        let data =
            diesel::delete(novel_comment::table.filter(novel_comment::novel_id.eq(novel_id)))
                .get_result(conn)?;
        Ok(data)
    }
    pub(in crate::application) fn update(
        novel_id: i64,
        content: &str,
        now: OffsetDateTime,
        conn: &mut PgConnection,
    ) -> AppResult<NovelCommentModel> {
        let data =
            diesel::update(novel_comment::table.filter(novel_comment::novel_id.eq(novel_id)))
                .set((
                    novel_comment::content.eq(content),
                    novel_comment::update_time.eq(now),
                ))
                .get_result(conn)?;
        Ok(data)
    }
}
