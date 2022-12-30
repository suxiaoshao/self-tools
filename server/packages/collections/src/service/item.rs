use crate::model::collection::CollectionModel;
use crate::model::item::ItemModel;
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::CONNECTION,
};
use async_graphql::{ComplexObject, SimpleObject};
use time::OffsetDateTime;

use super::collection::Collection;

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Item {
    pub id: i64,
    pub name: String,
    pub content: String,
    #[graphql(skip)]
    pub collection_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

#[ComplexObject]
impl Item {
    async fn collection(&self) -> GraphqlResult<Option<Collection>> {
        let collection = Collection::get(self.collection_id)?;
        Ok(Some(collection))
    }
}

impl From<ItemModel> for Item {
    fn from(value: ItemModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            content: value.content,
            collection_id: value.collection_id,
            create_time: value.create_time,
            update_time: value.update_time,
        }
    }
}

impl Item {
    /// 创建记录
    pub fn create(name: String, content: String, collection_id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        let new_item = ItemModel::create(&name, &content, collection_id, conn)?;
        Ok(new_item.into())
    }
    /// 删除记录
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        if !ItemModel::exists(id, conn)? {
            return Err(GraphqlError::NotFound("记录", id));
        }
        let item = ItemModel::delete(id, conn)?;
        Ok(item.into())
    }
    /// 获取记录
    pub fn get(id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        if !ItemModel::exists(id, conn)? {
            return Err(GraphqlError::NotFound("记录", id));
        }
        let item = ItemModel::find_one(id, conn)?;
        Ok(item.into())
    }
}

/// collection_id 相关
impl Item {
    /// 选择记录
    pub fn query(collection_id: i64, offset: i64, limit: i64) -> GraphqlResult<Vec<Self>> {
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        let data = ItemModel::query(collection_id, offset, limit, conn)?
            .into_iter()
            .map(Into::into)
            .collect();
        Ok(data)
    }
    /// 记录数量
    pub fn count(collection_id: i64) -> GraphqlResult<i64> {
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        ItemModel::count(collection_id, conn)
    }
}
