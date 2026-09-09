use super::schema::{chapter, custom_type::NovelSite, read_record};
use crate::errors::AppResult;
use diesel::{
    dsl::exists,
    pg::Pg,
    prelude::*,
    query_builder::{QueryFragment, QueryId},
    sql_types::{BigInt, Text, Timestamptz},
};

use time::OffsetDateTime;

#[derive(Queryable)]
pub(in crate::application) struct ChapterModel {
    pub(in crate::application) id: i64,
    pub(in crate::application) title: String,
    pub(in crate::application) site: NovelSite,
    pub(in crate::application) site_id: String,
    pub(in crate::application) content: Option<String>,
    pub(in crate::application) time: OffsetDateTime,
    pub(in crate::application) word_count: i64,
    pub(in crate::application) novel_id: i64,
    pub(in crate::application) author_id: i64,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
    // 是否已读
    pub(in crate::application) is_read: bool,
}

/// 小说章节
impl ChapterModel {
    /// 获取小说章节列表
    pub(in crate::application) fn get_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let chapters = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .order(chapter::time.asc())
            .select((
                chapter::id,
                chapter::title,
                chapter::site,
                chapter::site_id,
                chapter::content,
                chapter::time,
                chapter::word_count,
                chapter::novel_id,
                chapter::author_id,
                chapter::create_time,
                chapter::update_time,
                // is_read: true if there's any matching read_record
                exists(read_record::table.filter(read_record::chapter_id.eq(chapter::id))),
            ))
            .load::<Self>(conn)?;
        Ok(chapters)
    }

    /// 根据 novel_id 删除章节
    pub(in crate::application) fn delete_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<usize> {
        let count =
            diesel::delete(chapter::table.filter(chapter::novel_id.eq(novel_id))).execute(conn)?;
        Ok(count)
    }
    /// ids 删除章节
    pub(in crate::application) fn delete_by_ids(
        ids: &[i64],
        conn: &mut PgConnection,
    ) -> AppResult<usize> {
        let count = diesel::delete(chapter::table.filter(chapter::id.eq_any(ids))).execute(conn)?;
        Ok(count)
    }

    /// 获取某个 novel 下的字数
    pub(in crate::application) fn get_word_count_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<bigdecimal::BigDecimal> {
        let word_count = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .select(diesel::dsl::sum(chapter::word_count))
            .first::<Option<bigdecimal::BigDecimal>>(conn)?
            .unwrap_or(bigdecimal::BigDecimal::from(0));
        Ok(word_count)
    }
    /// 获取某个 novel 下的最新章节
    pub(in crate::application) fn get_last_chapter_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Option<Self>> {
        let chapter = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .order(chapter::time.desc())
            .select((
                chapter::id,
                chapter::title,
                chapter::site,
                chapter::site_id,
                chapter::content,
                chapter::time,
                chapter::word_count,
                chapter::novel_id,
                chapter::author_id,
                chapter::create_time,
                chapter::update_time,
                // is_read: true if there's any matching read_record
                exists(read_record::table.filter(read_record::chapter_id.eq(chapter::id))),
            ))
            .first::<Self>(conn)
            .optional()?;
        Ok(chapter)
    }
    /// 获取某个 novel 下的最早章节
    pub(in crate::application) fn get_first_chapter_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Option<Self>> {
        let chapter = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .order(chapter::time.asc())
            .select((
                chapter::id,
                chapter::title,
                chapter::site,
                chapter::site_id,
                chapter::content,
                chapter::time,
                chapter::word_count,
                chapter::novel_id,
                chapter::author_id,
                chapter::create_time,
                chapter::update_time,
                // is_read: true if there's any matching read_record
                exists(read_record::table.filter(read_record::chapter_id.eq(chapter::id))),
            ))
            .first::<Self>(conn)
            .optional()?;
        Ok(chapter)
    }
    /// 获取某个 novel 下的所有章节 id
    pub(in crate::application) fn get_chapter_ids(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<i64>> {
        let chapter_ids = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .select(chapter::id)
            .load::<i64>(conn)?;
        Ok(chapter_ids)
    }
}

#[derive(Insertable)]
#[diesel(table_name = chapter)]
pub(in crate::application) struct NewChapter<'a> {
    pub(in crate::application) title: &'a str,
    pub(in crate::application) site: NovelSite,
    pub(in crate::application) site_id: &'a str,
    pub(in crate::application) content: Option<&'a str>,
    pub(in crate::application) time: OffsetDateTime,
    pub(in crate::application) word_count: i64,
    pub(in crate::application) novel_id: i64,
    pub(in crate::application) author_id: i64,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

impl NewChapter<'_> {
    /// 创建多个章节
    pub(in crate::application) fn create_many(
        data: &[NewChapter],
        conn: &mut PgConnection,
    ) -> AppResult<Vec<ChapterModel>> {
        let new_chapters: Vec<_> = diesel::insert_into(chapter::table)
            .values(data)
            .get_results(conn)?;
        let new_chapters = new_chapters
            .into_iter()
            .map(
                |(
                    id,
                    title,
                    site,
                    site_id,
                    content,
                    time,
                    word_count,
                    novel_id,
                    author_id,
                    create_time,
                    update_time,
                )| {
                    ChapterModel {
                        id,
                        title,
                        site,
                        site_id,
                        content,
                        time,
                        word_count,
                        novel_id,
                        author_id,
                        create_time,
                        update_time,
                        is_read: false,
                    }
                },
            )
            .collect();
        Ok(new_chapters)
    }
}

#[derive(AsChangeset, Identifiable)]
#[diesel(table_name = chapter)]
pub(in crate::application) struct UpdateChapterModel<'a> {
    pub(in crate::application) id: i64,
    pub(in crate::application) title: &'a str,
    pub(in crate::application) time: OffsetDateTime,
    pub(in crate::application) word_count: i64,
    pub(in crate::application) update_time: OffsetDateTime,
}

impl UpdateChapterModel<'_> {
    /// 更新章节
    pub(in crate::application) fn update_many<'a>(
        data: &'a [UpdateChapterModel<'a>],
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        struct VecUpdateChapterModel<'a>(&'a [UpdateChapterModel<'a>]);

        impl VecUpdateChapterModel<'_> {
            fn new<'a>(data: &'a [UpdateChapterModel<'a>]) -> VecUpdateChapterModel<'a> {
                VecUpdateChapterModel(data)
            }
        }

        impl QueryId for VecUpdateChapterModel<'_> {
            type QueryId = ();
            const HAS_STATIC_QUERY_ID: bool = false;
        }

        impl QueryFragment<Pg> for VecUpdateChapterModel<'_> {
            fn walk_ast<'b>(
                &'b self,
                mut out: diesel::query_builder::AstPass<'_, 'b, Pg>,
            ) -> QueryResult<()> {
                if self.0.is_empty() {
                    out.push_sql("SELECT 1 FROM ");
                    chapter::table.walk_ast(out.reborrow())?;
                    out.push_sql(" WHERE 1=0");
                    return Ok(());
                }
                out.push_sql("UPDATE");
                chapter::table.walk_ast(out.reborrow())?;
                out.push_sql(
                    r#"SET
                           title = data.title,
                           time = data.time,
                           word_count = data.word_count,
                           update_time = data.update_time
                       from (
                           values"#,
                );
                for (i, chapter) in self.0.iter().enumerate() {
                    if i > 0 {
                        out.push_sql(", ");
                    }
                    out.push_sql("(");
                    out.push_bind_param::<BigInt, _>(&chapter.id)?;
                    out.push_sql(", ");
                    out.push_bind_param::<Text, _>(&chapter.title)?;
                    out.push_sql(", ");
                    out.push_bind_param::<Timestamptz, _>(&chapter.time)?;
                    out.push_sql(", ");
                    out.push_bind_param::<BigInt, _>(&chapter.word_count)?;
                    out.push_sql(", ");
                    out.push_bind_param::<Timestamptz, _>(&chapter.update_time)?;
                    out.push_sql(")");
                }
                out.push_sql(
                    r#") as data(id, title, time, word_count, update_time)
                       WHERE chapter.id = data.id"#,
                );
                Ok(())
            }
        }

        impl RunQueryDsl<PgConnection> for VecUpdateChapterModel<'_> {}
        let data = VecUpdateChapterModel::new(data);
        data.execute(conn)?;
        Ok(())
    }
}
