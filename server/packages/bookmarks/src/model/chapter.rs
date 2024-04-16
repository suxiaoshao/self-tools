/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 11:50:26
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/chapter.rs
 */
use diesel::prelude::*;
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
