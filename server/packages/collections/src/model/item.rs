use crate::{errors::GraphqlResult, graphql::types::TimeRange, model::schema::collection_item};

use super::schema::item;
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub(crate) struct ItemModel {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) content: String,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = item)]
struct NewItem<'a> {
    pub(crate) name: &'a str,
    pub(crate) content: &'a str,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

/// id 相关
impl ItemModel {
    /// 创建记录
    pub(crate) fn create(
        name: &str,
        content: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_item = NewItem {
            name,
            content,
            create_time: now,
            update_time: now,
        };
        let new_item = diesel::insert_into(item::table)
            .values(&new_item)
            .get_result(conn)?;
        Ok(new_item)
    }
    /// 删除记录
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let item = diesel::delete(item::table.filter(item::id.eq(id))).get_result(conn)?;
        Ok(item)
    }
    /// 查找记录
    pub(crate) fn find_one(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let item = item::table.filter(item::id.eq(id)).first::<Self>(conn)?;
        Ok(item)
    }
    /// 判断是否存在
    pub(crate) fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(item::table.find(id))).get_result(conn)?;
        Ok(exists)
    }
    /// 更新记录
    pub(crate) fn update(
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
    /// 根据 item_id 删除记录
    pub(crate) fn delete_reletive_by_item_id(
        item_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let deleted =
            diesel::delete(collection_item::table.filter(collection_item::item_id.eq(item_id)))
                .execute(conn)?;
        Ok(deleted)
    }
    /// 添加 collections
    pub(crate) fn add_collections(
        &self,
        collection_ids: &[i64],
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let values = collection_ids
            .iter()
            .map(|collection_id| {
                (
                    collection_item::item_id.eq(self.id),
                    collection_item::collection_id.eq(*collection_id),
                )
            })
            .collect::<Vec<_>>();
        let inserted = diesel::insert_into(collection_item::table)
            .values(values)
            .execute(conn)?;
        Ok(inserted)
    }
}

/// collection_id 相关
impl ItemModel {
    /// 查询记录
    pub(crate) fn query(
        collection_id: i64,
        create_time: Option<TimeRange>,
        update_time: Option<TimeRange>,
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        match (create_time, update_time) {
            (None, None) => {
                let data = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .offset(offset)
                    .limit(limit)
                    .load::<(ItemModel, (i64, i64))>(conn)?;
                Ok(data.into_iter().map(|(item, _)| item).collect())
            }
            (None, Some(update_time)) => {
                let data = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .filter(item::update_time.between(update_time.start, update_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load::<(ItemModel, (i64, i64))>(conn)?;
                Ok(data.into_iter().map(|(item, _)| item).collect())
            }
            (Some(create_time), None) => {
                let data = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .filter(item::create_time.between(create_time.start, create_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load::<(ItemModel, (i64, i64))>(conn)?;
                Ok(data.into_iter().map(|(item, _)| item).collect())
            }
            (Some(create_time), Some(update_time)) => {
                let data = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .filter(item::create_time.between(create_time.start, create_time.end))
                    .filter(item::update_time.between(update_time.start, update_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load::<(ItemModel, (i64, i64))>(conn)?;
                Ok(data.into_iter().map(|(item, _)| item).collect())
            }
        }
    }
    /// 查询记录数量
    pub(crate) fn count(
        collection_id: i64,
        create_time: Option<TimeRange>,
        update_time: Option<TimeRange>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<i64> {
        match (create_time, update_time) {
            (None, None) => {
                let count = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (None, Some(update_time)) => {
                let count = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .filter(item::update_time.between(update_time.start, update_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (Some(create_time), None) => {
                let count = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .filter(item::create_time.between(create_time.start, create_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (Some(create_time), Some(update_time)) => {
                let count = item::table
                    .inner_join(collection_item::table)
                    .filter(collection_item::collection_id.eq(collection_id))
                    .filter(item::create_time.between(create_time.start, create_time.end))
                    .filter(item::update_time.between(update_time.start, update_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
        }
    }
}
