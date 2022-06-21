use crate::errors::GraphqlResult;

use super::schema::collection;
use super::CONNECTION;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct CollectionModel {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub father_collection: Option<i64>,
    pub description: Option<String>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "collection"]
struct NewCollection<'a> {
    pub name: &'a str,
    pub path: &'a str,
    pub parent_id: Option<i64>,
    pub description: Option<String>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

/// path 相关
impl CollectionModel {
    /// 创建目录
    pub fn create(
        name: &str,
        path: &str,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> GraphqlResult<Self> {
        let now = chrono::Local::now().naive_local();
        let new_collection = NewCollection {
            name,
            path,
            parent_id,
            description,
            create_time: now,
            update_time: now,
        };
        let conn = CONNECTION.get()?;

        let new_collection = diesel::insert_into(collection::table)
            .values(&new_collection)
            .get_result(&conn)?;
        Ok(new_collection)
    }
    /// 判断目录是否存在
    pub fn exists(id: i64) -> GraphqlResult<bool> {
        let conn = CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::id.eq(id)),
        ))
        .get_result(&conn)?;
        Ok(exists)
    }
    /// 查找目录
    pub fn find_one(id: i64) -> GraphqlResult<Self> {
        let conn = CONNECTION.get()?;
        let collection = collection::table
            .filter(collection::id.eq(id))
            .first(&conn)?;
        Ok(collection)
    }
    /// 删除目录
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = CONNECTION.get()?;
        let collection = diesel::delete(collection::table.filter(collection::id.eq(id)))
            .get_result(&conn)?;
        Ok(collection)
    }
}

/// path 相关
impl CollectionModel {
    /// 是否存在该路径
    pub fn exists_by_path(path: &str) -> GraphqlResult<bool> {
        let conn = CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::path.eq(path)),
        ))
        .get_result(&conn)?;
        Ok(exists)
    }
}

/// parent_collection 相关
impl CollectionModel {
    /// 获取父目录下的所有目录
    pub fn get_list(&self) -> GraphqlResult<Vec<Self>> {
        let conn = CONNECTION.get()?;
        let collection = collection::table
            .filter(collection::parent_id.eq(self.id))
            .get_results(&conn)?;
        Ok(collection)
    }
}
