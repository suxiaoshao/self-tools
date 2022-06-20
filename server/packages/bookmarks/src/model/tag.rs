use crate::errors::GraphqlResult;

use super::schema::tag;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Queryable)]
pub struct TagModel {
    pub id: i64,
    pub name: String,
    pub directory_id: Option<i64>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}
#[derive(Insertable)]
#[table_name = "tag"]
pub struct NewTag {
    pub name: String,
    pub directory_id: Option<i64>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

impl TagModel {
    /// 创建标签
    pub fn create(name: &str, directory_id: Option<i64>) -> GraphqlResult<Self> {
        let now = chrono::Local::now().naive_local();
        let new_tag = NewTag {
            name: name.to_string(),
            directory_id,
            create_time: now,
            update_time: now,
        };
        let conn = super::CONNECTION.get()?;

        let new_tag = diesel::insert_into(tag::table)
            .values(&new_tag)
            .get_result(&conn)?;
        Ok(new_tag)
    }
    /// 是否存在
    pub fn exists(id: i64) -> GraphqlResult<bool> {
        let conn = super::CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(tag::table.filter(tag::id.eq(id))))
            .get_result(&conn)?;
        Ok(exists)
    }
    /// 删除标签
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = super::CONNECTION.get()?;
        let deleted = diesel::delete(tag::table.filter(tag::id.eq(id))).get_result(&conn)?;
        Ok(deleted)
    }
}
