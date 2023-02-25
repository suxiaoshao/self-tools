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
#[diesel(table_name = author)]
pub struct NewAuthor<'a> {
    pub url: &'a str,
    pub name: &'a str,
    pub avatar: &'a str,
    pub description: &'a str,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

/// id 相关的操作
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
        let conn = &mut super::CONNECTION.get()?;

        let new_author = diesel::insert_into(author::table)
            .values(&new_author)
            .get_result(conn)?;
        Ok(new_author)
    }
    /// 是否存在
    pub fn exists(id: i64) -> GraphqlResult<bool> {
        let conn = &mut super::CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(author::table.filter(author::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除作者
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = &mut super::CONNECTION.get()?;
        let deleted = diesel::delete(author::table.filter(author::id.eq(id))).get_result(conn)?;
        Ok(deleted)
    }
    /// 获取作者
    pub fn get(id: i64) -> GraphqlResult<Self> {
        let conn = &mut super::CONNECTION.get()?;
        let author = author::table.filter(author::id.eq(id)).first(conn)?;
        Ok(author)
    }
}

impl AuthorModel {
    /// 获取所有作者
    pub fn get_list() -> GraphqlResult<Vec<Self>> {
        let conn = &mut super::CONNECTION.get()?;
        let authors = author::table.load(conn)?;
        Ok(authors)
    }
    /// 获取作者搜索列表
    pub fn get_search_list(search_name: String) -> GraphqlResult<Vec<Self>> {
        let conn = &mut super::CONNECTION.get()?;
        let authors = author::table
            .filter(author::name.like(format!("%{search_name}%")))
            .load(conn)?;
        Ok(authors)
    }
}
