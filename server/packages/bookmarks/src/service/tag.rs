/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-27 05:32:19
 */

use diesel::PgConnection;

use crate::{
    errors::{AppError, AppResult},
    model::{PgPool, schema::custom_type::NovelSite, tag::TagModel},
};

#[derive(Eq, PartialEq)]
pub(crate) struct Tag {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
}

impl From<TagModel> for Tag {
    fn from(value: TagModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            site: value.site,
            site_id: value.site_id,
            create_time: value.create_time,
            update_time: value.update_time,
        }
    }
}

/// id 相关
impl Tag {
    /// 创建标签
    pub(crate) fn create(
        name: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        if name.chars().count() > 20 {
            return Err(crate::errors::invalid(
                "name",
                service_errors::ValidationCode::TooLong,
            ));
        }
        super::write(conn, |conn| {
            Ok(TagModel::create(name, site, site_id, conn)?.into())
        })
        .map_err(crate::errors::source_conflict)
    }
    /// 删除标签
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        crate::errors::validate_id(id, "id")?;
        super::write(conn, |conn| {
            if TagModel::exists(id, conn)? {
                use diesel::RunQueryDsl;
                // Tags are stored in an array without an FK; maintain the relation on deletion.
                diesel::sql_query("UPDATE novel SET tags=array_remove(tags,$1) WHERE $1=ANY(tags)")
                    .bind::<diesel::sql_types::BigInt, _>(id)
                    .execute(conn)?;
                TagModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
    /// 获取标签列表
    pub(crate) fn get_by_ids(ids: &[i64], conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let tags = TagModel::get_by_ids(ids, conn)?;
        Ok(tags.into_iter().map(|x| x.into()).collect())
    }
}

/// all
impl Tag {
    /// 获取所有标签
    pub(crate) fn all(conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let tags = TagModel::get_list(conn)?;
        Ok(tags.into_iter().map(|x| x.into()).collect())
    }
}

pub(crate) struct TagRunner {
    conn: PgPool,
    count: i64,
}

impl TagRunner {
    pub(crate) fn new(conn: PgPool) -> AppResult<Self> {
        let conn_temp = &mut conn.get()?;
        let count = TagModel::count(conn_temp)?;
        Ok(Self { conn, count })
    }
}

impl service_query::Queryable for TagRunner {
    type Item = Tag;

    type Error = AppError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: service_query::Paginate>(
        &self,
        pagination: P,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();

        let limit = pagination.limit();
        let conn = &mut self.conn.get()?;
        let tags = TagModel::get_list_by_pagination(offset, limit, conn)?;
        Ok(tags.into_iter().map(|tag| tag.into()).collect())
    }
}
