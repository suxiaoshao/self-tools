use crate::errors::GraphqlResult;

use super::schema::item;
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct ItemModel {
    pub id: i64,
    pub name: String,
    pub content: String,
    pub collection_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = item)]
struct NewItem<'a> {
    pub name: &'a str,
    pub content: &'a str,
    pub collection_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// id 相关
impl ItemModel {
    /// 创建记录
    pub fn create(
        name: &str,
        content: &str,
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_item = NewItem {
            name,
            content,
            collection_id,
            create_time: now,
            update_time: now,
        };
        let new_item = diesel::insert_into(item::table)
            .values(&new_item)
            .get_result(conn)?;
        Ok(new_item)
    }
    /// 删除记录
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let item = diesel::delete(item::table.filter(item::id.eq(id))).get_result(conn)?;
        Ok(item)
    }
    /// 查找记录
    pub fn find_one(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let item = item::table.filter(item::id.eq(id)).first::<Self>(conn)?;
        Ok(item)
    }
    /// 判断是否存在
    pub fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(item::table.find(id))).get_result(conn)?;
        Ok(exists)
    }
    /// 更新记录
    pub fn update(
        id: i64,
        name: &str,
        content: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let item = diesel::update(item::table.find(id))
            .set((
                item::name.eq(name),
                item::content.eq(content),
                item::update_time.eq(now),
            ))
            .get_result(conn)?;
        Ok(item)
    }
}

/// collection_id 相关
impl ItemModel {
    /// 查询记录
    pub fn query(
        collection_id: i64,
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        // 获取数据
        let data = item::table
            .filter(item::collection_id.eq(collection_id))
            .offset(offset)
            .limit(limit)
            .load(conn)?;
        Ok(data)
    }
    /// 查询记录数量
    pub fn count(collection_id: i64, conn: &mut PgConnection) -> GraphqlResult<i64> {
        let count = item::table
            .filter(item::collection_id.eq(collection_id))
            .count()
            .get_result(conn)?;
        Ok(count)
    }
    /// 根据 collection_id 删除记录
    pub fn delete_by_collection_id(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let deleted = diesel::delete(item::table.filter(item::collection_id.eq(collection_id)))
            .execute(conn)?;
        Ok(deleted)
    }
}
