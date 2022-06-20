use async_graphql::SimpleObject;

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::tag::TagModel,
};

#[derive(SimpleObject)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub directory_id: Option<i64>,
    pub create_time: i64,
    pub update_time: i64,
}

impl From<TagModel> for Tag {
    fn from(value: TagModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            directory_id: value.directory_id,
            create_time: value.create_time.timestamp_millis(),
            update_time: value.update_time.timestamp_millis(),
        }
    }
}

impl Tag {
    /// 创建标签
    pub fn create(name: &str, directory_id: Option<i64>) -> GraphqlResult<Self> {
        //  判断父目录是否存在
        if let Some(directory) = directory_id {
            if !TagModel::exists(directory)? {
                return Err(GraphqlError::NotFound("目录"));
            }
        }
        let new_tag = TagModel::create(name, directory_id)?;
        Ok(new_tag.into())
    }
    /// 删除标签
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        // 标签不存在
        if !TagModel::exists(id)? {
            return Err(GraphqlError::NotFound("标签"));
        }
        let deleted_tag = TagModel::delete(id)?;
        Ok(deleted_tag.into())
    }
}
