/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-25 17:24:18
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/chapter.rs
 */
use super::{
    novel::NovelModel,
    schema::{chapter, custom_type::NovelSite, read_record},
};
use crate::errors::GraphqlResult;
use diesel::{
    dsl::exists,
    pg::Pg,
    prelude::*,
    query_builder::{QueryFragment, QueryId},
    sql_types::{BigInt, Text, Timestamptz},
};
use novel_crawler::{AuthorFn, ChapterFn};
use std::collections::{HashMap, HashSet};
use time::OffsetDateTime;

#[derive(Queryable)]
pub(crate) struct ChapterModel {
    pub(crate) id: i64,
    pub(crate) title: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) content: Option<String>,
    pub(crate) time: OffsetDateTime,
    pub(crate) word_count: i64,
    pub(crate) novel_id: i64,
    pub(crate) author_id: i64,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
    // 是否已读
    pub(crate) is_read: bool,
}

/// 小说章节
impl ChapterModel {
    /// 获取小说章节列表
    pub(crate) fn get_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
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
    /// 根据 author_id 删除章节
    pub(crate) fn delete_by_author_id(
        author_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let count = diesel::delete(chapter::table.filter(chapter::author_id.eq(author_id)))
            .execute(conn)?;
        Ok(count)
    }
    /// 根据 novel_id 删除章节
    pub(crate) fn delete_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let count =
            diesel::delete(chapter::table.filter(chapter::novel_id.eq(novel_id))).execute(conn)?;
        Ok(count)
    }
    /// ids 删除章节
    pub(crate) fn delete_by_ids(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<usize> {
        let count = diesel::delete(chapter::table.filter(chapter::id.eq_any(ids))).execute(conn)?;
        Ok(count)
    }
    /// 获取 author_id 的章节
    pub(crate) fn get_by_author_id(
        author_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        let chapters = chapter::table
            .filter(chapter::author_id.eq(author_id))
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
    /// 获取某个 novel 下的字数
    pub(crate) fn get_word_count_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<bigdecimal::BigDecimal> {
        let word_count = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .select(diesel::dsl::sum(chapter::word_count))
            .first::<Option<bigdecimal::BigDecimal>>(conn)?
            .unwrap_or(bigdecimal::BigDecimal::from(0));
        Ok(word_count)
    }
    /// 获取某个 novel 下的最新章节
    pub(crate) fn get_last_chapter_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Option<Self>> {
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
    pub(crate) fn get_first_chapter_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Option<Self>> {
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
    pub(crate) fn get_chapter_ids(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<i64>> {
        let chapter_ids = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .select(chapter::id)
            .load::<i64>(conn)?;
        Ok(chapter_ids)
    }
}

#[derive(Insertable)]
#[diesel(table_name = chapter)]
pub(crate) struct NewChapter<'a> {
    pub(crate) title: &'a str,
    pub(crate) site: NovelSite,
    pub(crate) site_id: &'a str,
    pub(crate) content: Option<&'a str>,
    pub(crate) time: OffsetDateTime,
    pub(crate) word_count: i64,
    pub(crate) novel_id: i64,
    pub(crate) author_id: i64,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

impl NewChapter<'_> {
    /// 创建多个章节
    pub(crate) fn create_many(
        data: &[NewChapter],
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<ChapterModel>> {
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
pub(crate) struct UpdateChapterModel<'a> {
    pub(crate) id: i64,
    pub(crate) title: &'a str,
    pub(crate) time: OffsetDateTime,
    pub(crate) word_count: i64,
    pub(crate) update_time: OffsetDateTime,
}

impl<T: ChapterFn> PartialEq<T> for ChapterModel {
    fn eq(&self, other: &T) -> bool {
        self.title == other.title()
            && self.site_id == other.chapter_id()
            && self.time == other.time()
            && self.word_count == other.word_count() as i64
    }
}

impl UpdateChapterModel<'_> {
    /// 更新章节
    pub(crate) fn update_many<'a>(
        data: &'a [UpdateChapterModel<'a>],
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
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
    /// 根据 novel 获取待更新的章节
    pub(crate) fn from_novel<'a, T: ChapterFn>(
        chapters: &'a [ChapterModel],
        fetch_chapters: &'a [T],
        novel_id: i64,
        author_id: i64,
    ) -> (Vec<UpdateChapterModel<'a>>, Vec<NewChapter<'a>>, Vec<i64>) {
        let now = OffsetDateTime::now_utc();
        let mut update_chapters = Vec::new();
        let mut new_chapters = Vec::new();
        let mut delete_chapters = Vec::new();

        // 更新章节&删除章节
        let fetch_chapter_map: HashMap<&str, &T> = fetch_chapters
            .iter()
            .map(|chapter| (chapter.chapter_id(), chapter))
            .collect();
        for chapter in chapters {
            match fetch_chapter_map.get(chapter.site_id.as_str()) {
                Some(fetch_chapter) if chapter != *fetch_chapter => {
                    update_chapters.push(UpdateChapterModel {
                        id: chapter.id,
                        title: fetch_chapter.title(),
                        time: fetch_chapter.time(),
                        word_count: fetch_chapter.word_count() as i64,
                        update_time: now,
                    });
                }
                None => delete_chapters.push(chapter.id),
                _ => {}
            }
        }

        // 新增章节
        let chapter_map: HashMap<&str, &ChapterModel> = chapters
            .iter()
            .map(|chapter| (chapter.site_id.as_str(), chapter))
            .collect();
        for fetch_chapter in fetch_chapters {
            if !chapter_map.contains_key(fetch_chapter.chapter_id()) {
                new_chapters.push(NewChapter {
                    novel_id,
                    author_id,
                    site: T::Author::SITE.into(),
                    title: fetch_chapter.title(),
                    site_id: fetch_chapter.chapter_id(),
                    time: fetch_chapter.time(),
                    word_count: fetch_chapter.word_count() as i64,
                    create_time: now,
                    update_time: now,
                    content: None,
                });
            }
        }
        (update_chapters, new_chapters, delete_chapters)
    }
    /// 根据 author 获取待更新的章节
    pub(crate) fn from_author<'a, T: ChapterFn>(
        chapters: &'a [ChapterModel],
        fetch_chapters: &'a [T],
        new_novels: &'a [NovelModel],
        delete_novels: &'a [i64],
    ) -> GraphqlResult<(Vec<UpdateChapterModel<'a>>, Vec<NewChapter<'a>>, Vec<i64>)> {
        let mut update_chapters = Vec::new();
        let mut new_chapters = Vec::new();
        let mut delete_chapters = Vec::new();
        let now = OffsetDateTime::now_utc();

        let new_novel_map: HashMap<&str, _> = new_novels
            .iter()
            .map(|novel| (novel.site_id.as_str(), novel))
            .collect();
        let delete_novel_map: HashSet<i64> = delete_novels.iter().copied().collect();

        // 删除章节
        for chapter in chapters {
            if delete_novel_map.contains(&chapter.novel_id) {
                delete_chapters.push(chapter.id);
            }
        }

        for fetch_chapter in fetch_chapters {
            // 添加章节
            let novel = new_novel_map.get(fetch_chapter.novel_id());
            if let Some(novel) = novel {
                new_chapters.push(NewChapter {
                    title: fetch_chapter.title(),
                    site: T::Author::SITE.into(),
                    site_id: fetch_chapter.chapter_id(),
                    content: None,
                    time: fetch_chapter.time(),
                    word_count: fetch_chapter.word_count() as i64,
                    novel_id: novel.id,
                    author_id: novel.author_id,
                    create_time: now,
                    update_time: now,
                })
            }
            // 更新章节
            let chapter = chapters
                .iter()
                .find(|chapter| chapter.site_id == fetch_chapter.chapter_id());
            match chapter {
                Some(chapter) if chapter != fetch_chapter => {
                    update_chapters.push(UpdateChapterModel {
                        id: chapter.id,
                        title: fetch_chapter.title(),
                        time: fetch_chapter.time(),
                        word_count: fetch_chapter.word_count() as i64,
                        update_time: now,
                    });
                }
                _ => {}
            }
        }

        Ok((update_chapters, new_chapters, delete_chapters))
    }
}
