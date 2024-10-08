use crate::{
    common::{Paginate, Queryable},
    graphql::types::CollectionItemQuery,
    model::collection::CollectionModel,
};
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::CONNECTION,
};
use crate::{graphql::types::ItemAndCollection, model::item::ItemModel};
use async_graphql::{ComplexObject, SimpleObject};
use time::OffsetDateTime;
use tracing::{event, Level};

use super::collection::Collection;

#[derive(SimpleObject)]
#[graphql(complex)]
pub(crate) struct Item {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) content: String,
    #[graphql(skip)]
    pub(crate) collection_id: i64,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
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
    pub(crate) fn create(name: String, content: String, collection_id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            event!(Level::WARN, "目录不存在: {}", collection_id);
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        let new_item = ItemModel::create(&name, &content, collection_id, conn)?;
        Ok(new_item.into())
    }
    /// 删除记录
    pub(crate) fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        if !ItemModel::exists(id, conn)? {
            event!(Level::WARN, "记录不存在: {}", id);
            return Err(GraphqlError::NotFound("记录", id));
        }
        let item = ItemModel::delete(id, conn)?;
        Ok(item.into())
    }
    /// 获取记录
    pub(crate) fn get(id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        if !ItemModel::exists(id, conn)? {
            event!(Level::WARN, "记录不存在: {}", id);
            return Err(GraphqlError::NotFound("记录", id));
        }
        let item = ItemModel::find_one(id, conn)?;
        Ok(item.into())
    }
    /// 更新记录
    pub(crate) fn update(id: i64, name: &str, content: &str) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        if !ItemModel::exists(id, conn)? {
            event!(Level::WARN, "记录不存在: {}", id);
            return Err(GraphqlError::NotFound("记录", id));
        }
        let item = ItemModel::update(id, name, content, conn)?;
        Ok(item.into())
    }
}

pub(crate) struct ItemQueryRunner {
    query: CollectionItemQuery,
    count: i64,
}

impl ItemQueryRunner {
    pub(crate) async fn new(query: CollectionItemQuery) -> GraphqlResult<Self> {
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            ..
        } = query;
        let collection_id = match id {
            Some(id) => id,
            None => {
                return Ok(Self { query, count: 0 });
            }
        };
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            event!(Level::WARN, "目录不存在: {}", collection_id);
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        let count = ItemModel::count(collection_id, create_time, update_time, conn)?;
        Ok(Self { query, count })
    }
}

/// collection_id 相关
impl Queryable for ItemQueryRunner {
    type Item = ItemAndCollection;

    type Error = GraphqlError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: Paginate>(&self, pagination: P) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            pagination: source_pagination,
        } = self.query;
        let len = self.len().await?;
        if len < offset {
            event!(
                Level::ERROR,
                "全记录查询时页码太大 pagination: {:?} len: {} offset: {} offset_pagination: {:?}",
                source_pagination,
                len,
                offset,
                pagination
            );
            return Err(GraphqlError::PageSizeTooMore);
        }
        let limit = pagination.limit();
        let conn = &mut CONNECTION.get()?;
        let collection_id = match id {
            Some(id) => id,
            None => {
                return Ok(vec![]);
            }
        };
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            event!(Level::WARN, "目录不存在: {}", collection_id);
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        let data = ItemModel::query(collection_id, create_time, update_time, offset, limit, conn)?
            .into_iter()
            .map(|d| ItemAndCollection::Item(Item::from(d)))
            .collect();
        Ok(data)
    }
}
