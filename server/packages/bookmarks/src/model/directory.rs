use crate::errors::GraphqlResult;

use super::schema::directory;
use super::CONNECTION;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct DirectoryModel {
    pub id: i64,
    pub path: String,
    pub father_directory: Option<i64>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "directory"]
struct NewDirectory<'a> {
    pub path: &'a str,
    pub father_directory: Option<i64>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

/// path 相关
impl DirectoryModel {
    /// 创建目录
    pub fn create(path: &str, father_directory: i64) -> GraphqlResult<Self> {
        let now = chrono::Local::now().naive_local();
        let new_directory = NewDirectory {
            path,
            father_directory: Some(father_directory),
            create_time: now,
            update_time: now,
        };
        let conn = CONNECTION.get()?;

        let new_directory = diesel::insert_into(directory::table)
            .values(&new_directory)
            .get_result(&conn)?;
        Ok(new_directory)
    }
    /// 判断目录是否存在
    pub fn exists(path: &str) -> GraphqlResult<bool> {
        let conn = CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(
            directory::table.filter(directory::path.eq(path)),
        ))
        .get_result(&conn)?;
        Ok(exists)
    }
    /// 查找目录
    pub fn find_one(path: &str) -> GraphqlResult<Self> {
        let conn = CONNECTION.get()?;
        let directory = directory::table
            .filter(directory::path.eq(path))
            .first(&conn)?;
        Ok(directory)
    }
    /// 删除目录
    pub fn delete(path: &str) -> GraphqlResult<Self> {
        let conn = CONNECTION.get()?;
        let directory =
            diesel::delete(directory::table.filter(directory::path.eq(path))).get_result(&conn)?;
        Ok(directory)
    }
}

/// father_directory 相关
impl DirectoryModel {
    /// 获取父目录下的所有目录
    pub fn get_list(&self) -> GraphqlResult<Vec<Self>> {
        let conn = CONNECTION.get()?;
        let directory = directory::table
            .filter(directory::father_directory.eq(self.id))
            .get_results(&conn)?;
        Ok(directory)
    }
}
