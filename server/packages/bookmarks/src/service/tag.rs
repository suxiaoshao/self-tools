use async_graphql::SimpleObject;
use std::collections::HashSet;
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::model::collection::CollectionModel;
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::tag::TagModel,
};

#[derive(SimpleObject, Hash, Eq, PartialEq)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

impl From<TagModel> for Tag {
    fn from(value: TagModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            collection_id: value.collection_id,
            create_time: value.create_time,
            update_time: value.update_time,
        }
    }
}

/// id 相关
impl Tag {
    /// 创建标签
    pub fn create(name: &str, collection_id: Option<i64>) -> GraphqlResult<Self> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
                event!(Level::ERROR, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        let new_tag = TagModel::create(name, collection_id)?;
        Ok(new_tag.into())
    }
    /// 删除标签
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        // 标签不存在
        if !TagModel::exists(id)? {
            event!(Level::ERROR, "标签不存在: {}", id);
            return Err(GraphqlError::NotFound("标签", id));
        }
        let deleted_tag = TagModel::delete(id)?;
        Ok(deleted_tag.into())
    }
    /// 获取标签列表
    pub fn get_by_ids(ids: &[i64]) -> GraphqlResult<Vec<Self>> {
        let tags = TagModel::get_by_ids(ids)?;
        Ok(tags.into_iter().map(|x| x.into()).collect())
    }
    /// 判断标签是否全部存在
    pub fn exists_all<'a, T: Iterator<Item = &'a i64>>(tags: T) -> GraphqlResult<()> {
        let tag_ids: HashSet<i64> = tags.cloned().collect();
        let database_tags = TagModel::get_list()?;
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

/// collection_id 相关
impl Tag {
    /// 根据 collection_id 删除标签
    pub fn delete_by_collection(collection_id: i64) -> GraphqlResult<()> {
        TagModel::delete_by_collection(collection_id)?;
        Ok(())
    }
    /// 验证 tags 属于 collection_id
    pub fn belong_to_collection<'a, T: Iterator<Item = &'a i64>>(
        collection_id: Option<i64>,
        tags: T,
    ) -> GraphqlResult<()> {
        let allow_tags = match collection_id {
            Some(id) => TagModel::allow_tags(id)?,
            None => TagModel::query_root()?,
        };
        let allow_tags: HashSet<_> = allow_tags.into_iter().map(|tag| tag.id).collect();
        // 存在不符合的 tags
        for tag in tags {
            if !allow_tags.contains(tag) {
                event!(
                    Level::ERROR,
                    "标签: {} 不属于集合: {:?}",
                    tag,
                    collection_id
                );
                return Err(GraphqlError::Scope {
                    sub_tag: "标签",
                    sub_value: *tag,
                    super_tag: "集合",
                    super_value: collection_id,
                });
            }
        }
        Ok(())
    }
    /// 获取标签列表
    pub fn query(collection_id: Option<i64>, deep_search: bool) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
                event!(Level::ERROR, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        // 获取标签列表
        let tags = match (collection_id, deep_search) {
            (Some(id), false) => TagModel::query_by_collection(id)?,
            (None, false) => TagModel::query_root()?,
            (None, true) => TagModel::get_list()?,
            (Some(id), true) => TagModel::allow_tags(id)?,
        };
        Ok(tags.into_iter().map(|tag| tag.into()).collect())
    }
}
