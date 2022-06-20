use crate::errors::GraphqlResult;

use super::schema::author;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Queryable)]
pub struct AuthorModel {
    pub id: i64,
    pub url: String,
    pub name: String,
    pub avatar: String,
    pub description: String,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}
#[derive(Insertable)]
#[table_name = "author"]
pub struct NewAuthor<'a> {
    pub url: &'a str,
    pub name: &'a str,
    pub avatar: &'a str,
    pub description: &'a str,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

impl AuthorModel {
    /// 创建作者
    pub fn create(url: &str, name: &str, avatar: &str, description: &str) -> GraphqlResult<Self> {
        let now = chrono::Local::now().naive_local();
        let new_author = NewAuthor {
            url,
            name,
            avatar,
            description,
            create_time: now,
            update_time: now,
        };
        let conn = super::CONNECTION.get()?;

        let new_author = diesel::insert_into(author::table)
            .values(&new_author)
            .get_result(&conn)?;
        Ok(new_author)
    }
    /// 是否存在
    pub fn exists(id: i64) -> GraphqlResult<bool> {
        let conn = super::CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(author::table.filter(author::id.eq(id))))
            .get_result(&conn)?;
        Ok(exists)
    }
    /// 删除作者
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = super::CONNECTION.get()?;
        let deleted = diesel::delete(author::table.filter(author::id.eq(id))).get_result(&conn)?;
        Ok(deleted)
    }
    /// 获取所有作者
    pub fn get_list() -> GraphqlResult<Vec<Self>> {
        let conn = super::CONNECTION.get()?;
        let authors = author::table.load(&conn)?;
        Ok(authors)
    }
}
