#[derive(Queryable)]
pub struct ChapterModel {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub novel_id: i32,
}
