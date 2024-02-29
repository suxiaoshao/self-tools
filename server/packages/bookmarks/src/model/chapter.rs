/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 07:30:03
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
    pub url: String,
    pub site: NovelSite,
    pub content: Option<String>,
    pub novel_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// 小说章节
impl ChapterModel {
    /// 获取小说章节列表
    pub fn get_by_novel_id(novel_id: i64) -> GraphqlResult<Vec<Self>> {
        let conn = &mut super::CONNECTION.get()?;
        let chapters = chapter::table
            .filter(chapter::novel_id.eq(novel_id))
            .load::<Self>(conn)?;
        Ok(chapters)
    }
}
