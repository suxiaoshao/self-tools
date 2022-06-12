#[derive(Queryable)]
pub struct AuthorModel {
    pub id: i32,
    pub url: String,
    pub name: String,
    pub avatar: String,
    pub description: String,
}
