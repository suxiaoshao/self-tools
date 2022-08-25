use async_graphql::SimpleObject;
use std::collections::{HashMap, HashSet};

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
    pub create_time: i64,
    pub update_time: i64,
}

impl From<TagModel> for Tag {
    fn from(value: TagModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            collection_id: value.collection_id,
            create_time: value.create_time.timestamp_millis(),
            update_time: value.update_time.timestamp_millis(),
        }
    }
}

impl Tag {
    /// 创建标签
    pub fn create(name: &str, collection_id: Option<i64>) -> GraphqlResult<Self> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
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
            return Err(GraphqlError::NotFound("标签", id));
        }
        let deleted_tag = TagModel::delete(id)?;
        Ok(deleted_tag.into())
    }
    /// 获取标签列表
    pub fn get_list(collection_id: Option<i64>) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        let tags = TagModel::get_list_by_collection_id(collection_id)?;
        Ok(tags.into_iter().map(|tag| tag.into()).collect())
    }
    /// 根据 collection_id 删除标签
    pub fn delete_by_collection(collection_id: i64) -> GraphqlResult<()> {
        TagModel::delete_by_collection(collection_id)?;
        Ok(())
    }
    /// 判断标签是否全部存在
    pub fn exists_all(tags: &[i64]) -> GraphqlResult<()> {
        let tag_ids: HashSet<i64> = tags.iter().cloned().collect();
        let database_tags = TagModel::get_list()?;
        let database_tags: HashSet<i64> = database_tags.into_iter().map(|tag| tag.id).collect();
        for id in tag_ids {
            if !database_tags.contains(&id) {
                return Err(GraphqlError::NotFound("标签", id));
            }
        }
        Ok(())
    }
    /// 递归获取标签列表
    pub fn get_recursion_id(collection_id: Option<i64>) -> GraphqlResult<HashSet<i64>> {
        let mut id = match collection_id {
            None => {
                return Ok(TagModel::get_list_by_collection_id(None)?
                    .into_iter()
                    .map(|tag| tag.id)
                    .collect())
            }
            Some(id) => id,
        };

        let tags = TagModel::get_list()?;
        let mut collections = CollectionModel::get_list()?
            .into_iter()
            .map(|CollectionModel { id, parent_id, .. }| (id, (parent_id, Vec::<Self>::new())))
            .collect::<HashMap<_, _>>();
        // 全局 tag 列表
        let mut result = HashSet::<i64>::new();
        // 遍历所有 tag, 将其加入到对应的 collection 中
        for tag in tags {
            match tag.collection_id {
                None => {
                    result.insert(tag.id);
                }
                Some(tags_collection_id) => {
                    if let Some((_, data)) = collections.get_mut(&tags_collection_id) {
                        data.push(tag.into());
                    }
                }
            }
        }
        while let Some((parent, tags)) = collections.remove(&id) {
            match parent {
                None => {
                    for tag in tags {
                        result.insert(tag.id);
                    }
                    return Ok(result);
                }
                Some(parent_id) => {
                    for tag in tags {
                        result.insert(tag.id);
                    }
                    id = parent_id;
                }
            }
        }
        Ok(result)
    }
}
