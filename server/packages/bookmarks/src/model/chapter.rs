/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-25 17:24:18
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/chapter.rs
 */
use diesel::{
    pg::Pg,
    prelude::*,
    query_builder::{QueryFragment, QueryId},
    sql_types::{BigInt, Text, Timestamptz},
};
use novel_crawler::{AuthorFn, ChapterFn};
use std::collections::HashMap;
use time::OffsetDateTime;

use super::schema::{chapter, custom_type::NovelSite};
use crate::errors::GraphqlResult;

#[derive(Queryable)]
pub struct ChapterModel {
    pub id: i64,
    pub title: String,
    pub site: NovelSite,
    pub site_id: String,
    pub content: Option<String>,
    pub time: OffsetDateTime,
    pub word_count: i64,
    pub novel_id: i64,
    pub author_id: i64,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// 小说章节
impl ChapterModel {
    /// 获取小说章节列表
    pub fn get_by_novel_id(novel_id: i64, conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let chapters = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .load::<Self>(conn)?;
        Ok(chapters)
    }
    /// 根据 author_id 删除章节
    pub fn delete_by_author_id(author_id: i64, conn: &mut PgConnection) -> GraphqlResult<usize> {
        let count = diesel::delete(chapter::table.filter(chapter::author_id.eq(author_id)))
            .execute(conn)?;
        Ok(count)
    }
    /// 根据 collection_id 删除章节
    pub fn delete_by_collection_id(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let count = diesel::delete(chapter::table.filter(chapter::collection_id.eq(collection_id)))
            .execute(conn)?;
        Ok(count)
    }
    /// 根据 novel_id 删除章节
    pub fn delete_by_novel_id(novel_id: i64, conn: &mut PgConnection) -> GraphqlResult<usize> {
        let count =
            diesel::delete(chapter::table.filter(chapter::novel_id.eq(novel_id))).execute(conn)?;
        Ok(count)
    }
    /// ids 删除章节
    pub fn delete_by_ids(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<usize> {
        let count = diesel::delete(chapter::table.filter(chapter::id.eq_any(ids))).execute(conn)?;
        Ok(count)
    }
}

#[derive(Insertable)]
#[diesel(table_name = chapter)]
pub struct NewChapter<'a> {
    pub title: &'a str,
    pub site: NovelSite,
    pub site_id: &'a str,
    pub content: Option<&'a str>,
    pub time: OffsetDateTime,
    pub word_count: i64,
    pub novel_id: i64,
    pub author_id: i64,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

impl NewChapter<'_> {
    /// 创建多个章节
    pub fn create_many(
        data: &[NewChapter],
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<ChapterModel>> {
        let new_chapters = diesel::insert_into(chapter::table)
            .values(data)
            .get_results(conn)?;
        Ok(new_chapters)
    }
}

#[derive(AsChangeset, Identifiable)]
#[diesel(table_name = chapter)]
pub struct UpdateChapterModel<'a> {
    pub id: i64,
    pub title: &'a str,
    pub time: OffsetDateTime,
    pub word_count: i64,
    pub update_time: OffsetDateTime,
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
    pub fn update_many<'a>(
        data: &'a [UpdateChapterModel<'a>],
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        struct VecUpdateChapterModel<'a>(&'a [UpdateChapterModel<'a>]);

        impl VecUpdateChapterModel<'_> {
            fn new<'a>(data: &'a [UpdateChapterModel<'a>]) -> VecUpdateChapterModel<'a> {
                VecUpdateChapterModel(data)
            }
        }

        impl<'a> QueryId for VecUpdateChapterModel<'a> {
            type QueryId = ();
            const HAS_STATIC_QUERY_ID: bool = true;
        }

        impl<'a> QueryFragment<Pg> for VecUpdateChapterModel<'a> {
            fn walk_ast<'b>(
                &'b self,
                mut out: diesel::query_builder::AstPass<'_, 'b, Pg>,
            ) -> QueryResult<()> {
                if self.0.is_empty() {
                    return Ok(());
                }
                out.push_sql(
                    r#"UPDATE chapter SET
                           title = data.title,
                           time = data.time,
                           word_count=data.word_count,
                           update_time=data.update_time
                       from (
                           values"#,
                );
                for (i, chapter) in self.0.iter().enumerate() {
                    if i > 0 {
                        out.push_sql(", ");
                    }
                    out.push_sql("(");
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

        impl<'a> RunQueryDsl<PgConnection> for VecUpdateChapterModel<'a> {}
        let data = VecUpdateChapterModel::new(data);
        data.execute(conn)?;
        Ok(())
    }
    /// 获取待更新的章节
    pub fn from<'a, T: ChapterFn>(
        chapters: &'a [ChapterModel],
        fetch_chapters: &'a [T],
        novel_id: i64,
        author_id: i64,
        collection_id: Option<i64>,
    ) -> (Vec<UpdateChapterModel<'a>>, Vec<NewChapter<'a>>, Vec<i64>) {
        let now = OffsetDateTime::now_utc();
        let mut update_chapters = Vec::new();
        let mut new_chapters = Vec::new();
        let mut delete_chapters = Vec::new();
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
        let chapter_map: HashMap<&str, &ChapterModel> = chapters
            .iter()
            .map(|chapter| (chapter.site_id.as_str(), chapter))
            .collect();
        for fetch_chapter in fetch_chapters {
            if !chapter_map.contains_key(fetch_chapter.chapter_id()) {
                new_chapters.push(NewChapter {
                    novel_id,
                    author_id,
                    collection_id,
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
}
