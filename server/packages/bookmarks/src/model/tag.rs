use std::collections::HashSet;

use crate::errors::{GraphqlError, GraphqlResult};

use super::schema::tag;
use diesel::prelude::*;
use time::OffsetDateTime;
use tracing::{event, Level};

#[derive(Queryable)]
pub struct TagModel {
    pub id: i64,
    pub name: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = tag)]
pub struct NewTag {
    pub name: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// id 相关
impl TagModel {
    /// 创建标签
    pub fn create(name: &str, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_tag = NewTag {
            name: name.to_string(),
            create_time: now,
            update_time: now,
        };

        let new_tag = diesel::insert_into(tag::table)
            .values(&new_tag)
            .get_result(conn)?;
        Ok(new_tag)
    }
    /// 是否存在
    pub fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(tag::table.filter(tag::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除标签
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let deleted = diesel::delete(tag::table.filter(tag::id.eq(id))).get_result(conn)?;
        Ok(deleted)
    }
    /// 获取标签列表
    pub fn get_by_ids(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.filter(tag::id.eq_any(ids)).load::<Self>(conn)?;
        Ok(tags)
    }
    /// 判断标签是否全部存在
    pub fn exists_all<'a, T: Iterator<Item = &'a i64>>(
        tags: T,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        let tag_ids: HashSet<i64> = tags.cloned().collect();
        let database_tags = TagModel::get_list(conn)?;
        let database_tags: HashSet<i64> = database_tags.into_iter().map(|tag| tag.id).collect();
        for id in tag_ids {
            if !database_tags.contains(&id) {
                event!(Level::ERROR, "标签不存在: {}", id);
                return Err(GraphqlError::NotFound("标签", id));
            }
        }
        Ok(())
    }
}

/// all
impl TagModel {
    /// 获取所有标签
    pub fn get_list(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.load(conn)?;

        Ok(tags)
    }
}
