use crate::{
    errors::GraphqlResult,
    model::schema::{chapter, read_record},
};
use diesel::{prelude::Queryable, ExpressionMethods, PgConnection, QueryDsl, RunQueryDsl};
// use time::OffsetDateTime;

#[derive(Queryable)]
pub(crate) struct ReadRecordModel {
    // id: i64,
    // novel_id: i64,
    // chapter_id: i64,
    // read_time: OffsetDateTime,
}

impl ReadRecordModel {
    pub(crate) fn read_percentage_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<f64> {
        let total_chapters: i64 = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .count()
            .get_result(conn)?;

        let read_chapters = read_record::table
            .filter(read_record::novel_id.eq(novel_id))
            .filter(read_record::read_time.is_not_null())
            .count()
            .get_result::<i64>(conn)?;

        Ok((read_chapters as f64 / total_chapters as f64) * 100.0)
    }
}
