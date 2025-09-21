use crate::{
    errors::GraphqlResult,
    model::schema::{chapter, read_record},
};
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Insertable)]
#[diesel(table_name = read_record)]
pub(crate) struct NewReadRecord {
    pub novel_id: i64,
    pub chapter_id: i64,
    pub read_time: OffsetDateTime,
}

impl NewReadRecord {
    pub(crate) fn new(novel_id: i64, chapter_id: i64, read_time: OffsetDateTime) -> Self {
        Self {
            novel_id,
            chapter_id,
            read_time,
        }
    }
    pub(crate) fn create_many(
        read_records: &[NewReadRecord],
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let new_read_records = diesel::insert_into(read_record::table)
            .values(read_records)
            .execute(conn)?;
        Ok(new_read_records)
    }
}

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
    /// 获取某个 novel 下所有已阅读的章节 id
    pub(crate) fn read_chapter_ids_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<i64>> {
        let read_chapter_ids = read_record::table
            .filter(read_record::novel_id.eq(novel_id))
            .filter(read_record::read_time.is_not_null())
            .select(read_record::chapter_id)
            .load(conn)?;

        Ok(read_chapter_ids)
    }
    /// 根据 chapter_ids 删除记录
    pub(crate) fn delete_by_chapter_ids(
        chapter_ids: &[i64],
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let deleted_count = diesel::delete(read_record::table)
            .filter(read_record::chapter_id.eq_any(chapter_ids))
            .execute(conn)?;

        Ok(deleted_count)
    }
}
