use std::collections::HashSet;

use super::schema::novel;
use crate::errors::GraphqlResult;
use chrono::NaiveDateTime;
use diesel::prelude::*;

use super::schema::ReadStatus;

#[derive(Queryable)]
pub struct NovelModel {
    pub id: i64,
    pub name: String,
    pub author_id: i64,
    pub read_chapter_id: Option<i64>,
    pub description: String,
    pub tags: Vec<i64>,
    pub collection_id: i64,
    pub status: ReadStatus,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}
#[derive(Insertable)]
#[table_name = "novel"]
pub struct NewNovel<'a> {
    pub name: &'a str,
    pub author_id: i64,
    pub read_chapter_id: Option<i64>,
    pub description: &'a str,
    pub tags: &'a [i64],
    pub collection_id: i64,
    pub status: ReadStatus,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

impl NovelModel {
    /// 创建小说
    pub fn create(
        name: &str,
        author_id: i64,
        read_chapter_id: Option<i64>,
        description: &str,
        tags: &[i64],
        collection_id: i64,
        status: ReadStatus,
    ) -> GraphqlResult<Self> {
        let now = chrono::Local::now().naive_local();
        let new_novel = NewNovel {
            name,
            author_id,
            read_chapter_id,
            description,
            tags,
            collection_id,
            status,
            create_time: now,
            update_time: now,
        };
        let conn = super::CONNECTION.get()?;
        let new_novel = diesel::insert_into(novel::table)
            .values(&new_novel)
            .get_result(&conn)?;
        Ok(new_novel)
    }
    /// 查询小说
    pub fn query(
        collection_id: i64,
        match_tags: HashSet<i64>,
        tag_full_match: bool,
    ) -> GraphqlResult<Vec<Self>> {
        let data = novel::dsl::novel
            .filter(novel::dsl::collection_id.eq(collection_id))
            .load(&super::CONNECTION.get()?)?;

        let data = if tag_full_match {
            data.into_iter()
                .filter(|NovelModel { tags, .. }| {
                    let tags = tags.iter().cloned().collect::<HashSet<_>>();
                    match_tags.is_subset(&tags)
                })
                .collect()
        } else {
            data.into_iter()
                .filter(|NovelModel { tags, .. }| tags.iter().any(|x| match_tags.contains(x)))
                .collect()
        };
        Ok(data)
    }
}
