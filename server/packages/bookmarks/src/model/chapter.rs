use chrono::NaiveDateTime;
use diesel::Queryable;

#[derive(Queryable)]
pub struct ChapterModel {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub novel_id: i32,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}
