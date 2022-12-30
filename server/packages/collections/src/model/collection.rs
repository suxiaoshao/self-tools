use crate::errors::GraphqlResult;

use super::schema::collection;
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct CollectionModel {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub parent_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = collection)]
struct NewCollection<'a> {
    pub name: &'a str,
    pub path: &'a str,
    pub description: Option<String>,
    pub parent_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// id 相关
impl CollectionModel {
    /// 创建目录
    pub fn create(
        name: &str,
        path: &str,
        parent_id: Option<i64>,
        description: Option<String>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_collection = NewCollection {
            name,
            path,
            parent_id,
            description,
            create_time: now,
            update_time: now,
        };

        let new_collection = diesel::insert_into(collection::table)
            .values(&new_collection)
            .get_result(conn)?;
        Ok(new_collection)
    }
    /// 判断目录是否存在
    pub fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::id.eq(id)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
    /// 查找目录
    pub fn find_one(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let collection = collection::table
            .filter(collection::id.eq(id))
            .first(conn)?;
        Ok(collection)
    }
    /// 删除目录
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let collection =
            diesel::delete(collection::table.filter(collection::id.eq(id))).get_result(conn)?;
        Ok(collection)
    }
}

/// path 相关
impl CollectionModel {
    /// 是否存在该路径
    pub fn exists_by_path(path: &str, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::path.eq(path)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
}

/// parent_id 相关
impl CollectionModel {
    /// 获取父目录下的所有目录
    pub fn list_parent(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        match parent_id {
            Some(parent_id) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(parent_id))
                    .load(conn)?;
                Ok(collections)
            }
            None => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .load(conn)?;
                Ok(collections)
            }
        }
    }
    /// 获取父目录下的目录
    pub fn list_parent_with_page(
        parent_id: Option<i64>,
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        match parent_id {
            Some(parent_id) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(parent_id))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            None => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
        }
    }
    /// 获取父目录下的目录数量
    pub fn get_count_by_parent(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<i64> {
        match parent_id {
            Some(parent_id) => {
                let count = collection::table
                    .filter(collection::parent_id.eq(parent_id))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            None => {
                let count = collection::table
                    .filter(collection::parent_id.is_null())
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
        }
    }
}
