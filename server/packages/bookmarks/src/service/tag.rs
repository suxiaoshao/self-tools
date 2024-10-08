/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-27 05:32:19
 */
use async_graphql::{ComplexObject, SimpleObject};
use diesel::PgConnection;
use novel_crawler::{JJTag, QDTag, TagFn};
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{schema::custom_type::NovelSite, tag::TagModel},
};

#[derive(SimpleObject, Eq, PartialEq)]
#[graphql(complex)]
pub(crate) struct Tag {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

#[ComplexObject]
impl Tag {
    async fn url(&self) -> String {
        match self.site {
            NovelSite::Jjwxc => JJTag::get_url_from_id(&self.site_id),
            NovelSite::Qidian => QDTag::get_url_from_id(&self.site_id),
        }
    }
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
    ) -> GraphqlResult<Self> {
        let new_tag = TagModel::create(name, site, site_id, conn)?;
        Ok(new_tag.into())
    }
    /// 删除标签
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 标签不存在
        if !TagModel::exists(id, conn)? {
            event!(Level::ERROR, "标签不存在: {}", id);
            return Err(GraphqlError::NotFound("标签", id));
        }
        let deleted_tag = TagModel::delete(id, conn)?;
        Ok(deleted_tag.into())
    }
    /// 获取标签列表
    pub(crate) fn get_by_ids(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = TagModel::get_by_ids(ids, conn)?;
        Ok(tags.into_iter().map(|x| x.into()).collect())
    }
}

/// collection_id 相关
impl Tag {
    /// 获取标签列表
    pub(crate) fn query(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        // 获取标签列表
        let tags = TagModel::get_list(conn)?;
        Ok(tags.into_iter().map(|tag| tag.into()).collect())
    }
}
