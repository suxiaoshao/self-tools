use diesel::{prelude::Queryable, ExpressionMethods, PgConnection, QueryDsl, RunQueryDsl};

use crate::errors::GraphqlResult;
// use time::OffsetDateTime;

#[derive(Queryable)]
pub(crate) struct NovelCommentModel {
    // id: i64,
    // novel_id: i64,
    // author_id: i64,
    // content: String,
    // pub(crate) create_time: OffsetDateTime,
    // pub(crate) update_time: OffsetDateTime,
}

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
}
