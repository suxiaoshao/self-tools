use std::collections::{HashMap, HashSet};

use crate::errors::{GraphqlError, GraphqlResult};

use super::schema::{custom_type::NovelSite, tag};
use diesel::{connection::DefaultLoadingMode, prelude::*};
use time::OffsetDateTime;
use tracing::{event, Level};

#[derive(Queryable)]
pub(crate) struct TagModel {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

/// id 相关
impl TagModel {
    /// 创建标签
    pub(crate) fn create(
        name: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_tag = NewTag {
            name,
            create_time: now,
            update_time: now,
            site,
            site_id,
        };

        let new_tag = diesel::insert_into(tag::table)
            .values(&new_tag)
            .get_result(conn)?;
        Ok(new_tag)
    }
    /// 是否存在
    pub(crate) fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(tag::table.filter(tag::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除标签
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let deleted = diesel::delete(tag::table.filter(tag::id.eq(id))).get_result(conn)?;
        Ok(deleted)
    }
    /// 获取标签列表
    pub(crate) fn get_by_ids(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.filter(tag::id.eq_any(ids)).load::<Self>(conn)?;
        Ok(tags)
    }
    /// 判断标签是否全部存在
    pub(crate) fn exists_all(tag_ids: &HashSet<i64>, conn: &mut PgConnection) -> GraphqlResult<()> {
        let database_tags = TagModel::get_list(conn)?;
        let database_tags: HashSet<i64> = database_tags.into_iter().map(|tag| tag.id).collect();
        for id in tag_ids {
            if !database_tags.contains(id) {
                event!(Level::ERROR, "标签不存在: {}", id);
                return Err(GraphqlError::NotFound("标签", *id));
            }
        }
        Ok(())
    }
    /// 获取某个 site 下所有 tag
    pub(crate) fn many_site_id_by_site(
        site: NovelSite,
        conn: &mut PgConnection,
    ) -> GraphqlResult<HashMap<String, i64>> {
        let data = tag::table
            .select((tag::site_id, tag::id))
            .filter(tag::site.eq(site))
            .load_iter::<(String, i64), DefaultLoadingMode>(conn)?
            .collect::<Result<HashMap<String, i64>, diesel::result::Error>>()?;
        Ok(data)
    }
}

/// all
impl TagModel {
    /// 获取所有标签
    pub(crate) fn get_list(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.load(conn)?;
        Ok(tags)
    }
    /// 获取标签数量
    pub(crate) fn count(conn: &mut PgConnection) -> GraphqlResult<i64> {
        let count = tag::table.count().get_result(conn)?;
        Ok(count)
    }
    /// 获取标签分页列表
    pub(crate) fn get_list_by_pagination(
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.offset(offset).limit(limit).load(conn)?;
        Ok(tags)
    }
}

#[derive(Insertable)]
#[diesel(table_name = tag)]
pub(crate) struct NewTag<'a> {
    pub(crate) name: &'a str,
    pub(crate) site: NovelSite,
    pub(crate) site_id: &'a str,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

impl NewTag<'_> {
    pub(crate) fn save_many(
        data: &[Self],
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<TagModel>> {
        let result = diesel::insert_into(tag::table)
            .values(data)
            .get_results(conn)?;
        Ok(result)
    }
}
