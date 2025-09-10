use crate::{errors::GraphqlResult, model::schema::novel_comment};
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Insertable)]
#[diesel(table_name = novel_comment)]
pub(crate) struct NewNovelComment<'a> {
    novel_id: i64,
    author_id: i64,
    content: &'a str,
    create_time: OffsetDateTime,
    update_time: OffsetDateTime,
}

impl NewNovelComment<'_> {
    pub(crate) fn new<'a>(
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
    pub(crate) fn create(&self, conn: &mut PgConnection) -> GraphqlResult<NovelCommentModel> {
        use crate::model::schema::novel_comment::dsl::*;
        let result = diesel::insert_into(novel_comment)
            .values(self)
            .get_result(conn)?;
        Ok(result)
    }
}

#[derive(Queryable)]
pub(crate) struct NovelCommentModel {
    _id: i64,
    pub(crate) novel_id: i64,
    pub(crate) author_id: i64,
    pub(crate) content: String,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

// novel id
impl NovelCommentModel {
    pub(crate) fn content_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Option<String>> {
        use crate::model::schema::novel_comment;
        let comment = novel_comment::table
            .filter(novel_comment::novel_id.eq(novel_id))
            .select(novel_comment::content)
            .first(conn);
        match comment {
            Ok(id) => Ok(Some(id)),
            Err(diesel::NotFound) => Ok(None),
            Err(err) => Err(err.into()),
        }
    }
    pub(crate) fn exist_by_novel_id(novel_id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let data = diesel::select(diesel::dsl::exists(
            novel_comment::table.filter(novel_comment::novel_id.eq(novel_id)),
        ))
        .get_result(conn)?;
        Ok(data)
    }
    pub(crate) fn delete_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let data =
            diesel::delete(novel_comment::table.filter(novel_comment::novel_id.eq(novel_id)))
                .get_result(conn)?;
        Ok(data)
    }
    pub(crate) fn update(
        novel_id: i64,
        content: &str,
        now: OffsetDateTime,
        conn: &mut PgConnection,
    ) -> GraphqlResult<NovelCommentModel> {
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
