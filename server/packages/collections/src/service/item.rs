use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::PgPool,
};
use crate::{graphql::types::CollectionItemQuery, model::collection::CollectionModel};
use crate::{graphql::types::ItemAndCollection, model::item::ItemModel};
use async_graphql::{ComplexObject, Context, SimpleObject};
use diesel::{Connection, PgConnection};
use graphql_common::{Paginate, Queryable};
use time::OffsetDateTime;
use tracing::{event, Level};

use super::collection::Collection;

#[derive(SimpleObject)]
#[graphql(complex)]
pub(crate) struct Item {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) content: String,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

#[ComplexObject]
impl Item {
    async fn collections(&self, context: &Context<'_>) -> GraphqlResult<Vec<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let collection = CollectionModel::get_collections_by_item_id(self.id, conn)?;
        Ok(collection.into_iter().map(|c| c.into()).collect())
    }
}

impl From<ItemModel> for Item {
    fn from(value: ItemModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            content: value.content,
            create_time: value.create_time,
            update_time: value.update_time,
        }
    }
}

impl Item {
    /// 创建记录
    pub(crate) fn create(
        name: String,
        content: String,
        collection_ids: Vec<i64>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        //  判断父目录是否存在
        if !CollectionModel::exists_many(&collection_ids, conn)? {
            event!(Level::WARN, "父目录不存在: {:?}", collection_ids);
            return Err(GraphqlError::NotFoundMany("父目录", collection_ids));
        }
        let new_item = conn.transaction::<_, GraphqlError, _>(|conn| {
            let new_item = ItemModel::create(&name, &content, conn)?;
            new_item.add_collections(&collection_ids, conn)?;
            Ok(new_item.into())
        })?;
        Ok(new_item)
    }
    /// 删除记录
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        if !ItemModel::exists(id, conn)? {
            event!(Level::WARN, "记录不存在: {}", id);
            return Err(GraphqlError::NotFound("记录", id));
        }
        let data = conn.transaction::<_, GraphqlError, _>(|conn| {
            // 删除关系
            ItemModel::delete_reletive_by_item_id(id, conn)?;
            let item = ItemModel::delete(id, conn)?;
            Ok(item.into())
        })?;
        Ok(data)
    }
    /// 获取记录
    pub(crate) fn get(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        if !ItemModel::exists(id, conn)? {
            event!(Level::WARN, "记录不存在: {}", id);
            return Err(GraphqlError::NotFound("记录", id));
        }
        let item = ItemModel::find_one(id, conn)?;
        Ok(item.into())
    }
    /// 更新记录
    pub(crate) fn update(
        id: i64,
        name: &str,
        content: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
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
    conn: PgPool,
}

impl ItemQueryRunner {
    pub(crate) async fn new(query: CollectionItemQuery, conn: PgPool) -> GraphqlResult<Self> {
        let conn_temp = &mut conn.get()?;
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            ..
        } = query;
        let collection_id = match id {
            Some(id) => id,
            None => {
                return Ok(Self {
                    query,
                    count: 0,
                    conn,
                });
            }
        };
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn_temp)? {
            event!(Level::WARN, "目录不存在: {}", collection_id);
            return Err(GraphqlError::NotFound("目录", collection_id));
        }
        let count = ItemModel::count(collection_id, create_time, update_time, conn_temp)?;
        Ok(Self { query, count, conn })
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
        let conn = &mut self.conn.get()?;
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
