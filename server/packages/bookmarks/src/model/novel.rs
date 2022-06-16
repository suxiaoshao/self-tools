use chrono::NaiveDateTime;

use super::schema::ReadStatus;

#[derive(Queryable)]
pub struct NovelModel {
    pub id: i32,
    pub name: String,
    pub author_id: i32,
    pub read_chapter_id: Option<i32>,
    pub description: String,
    pub tags: Vec<i32>,
    pub directory_id: i32,
    pub status: ReadStatus,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}
