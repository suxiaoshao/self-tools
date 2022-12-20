use crate::errors::GraphqlResult;

use super::schema::collection;
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct CollectionModel {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = collection)]
struct NewCollection<'a> {
    pub name: &'a str,
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
        parent_id: Option<i64>,
        description: Option<String>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_collection = NewCollection {
            name,
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

/// parent_id 相关
impl CollectionModel {
    /// 获取父目录下的所有目录
    pub fn get_list_by_parent(
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
}

/// all
impl CollectionModel {
    /// 获取所有目录
    pub fn get_list(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let collections = collection::table.load(conn)?;
        Ok(collections)
    }
}
