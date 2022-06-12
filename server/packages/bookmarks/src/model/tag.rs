#[derive(Queryable)]
pub struct TagModel {
    pub id: i32,
    pub name: String,
    pub directory_id: Option<i32>,
}
