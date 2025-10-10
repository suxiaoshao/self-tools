use async_graphql::*;
use diesel::{Connection, PgConnection};
use graphql_common::{Paginate, Queryable};
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    graphql::types::{CollectionItemQuery, ItemAndCollection},
    model::{collection::CollectionModel, collection_item::CollectionItemModel, PgPool},
};

#[derive(SimpleObject)]
#[graphql(complex)]
pub(crate) struct Collection {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) path: String,
    pub(crate) parent_id: Option<i64>,
    pub(crate) description: Option<String>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}
#[ComplexObject]
impl Collection {
    /// 获取祖先列表
    async fn ancestors(&self, context: &Context<'_>) -> GraphqlResult<Vec<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let ancestors = Collection::get_ancestors(self.id, conn)?;
        Ok(ancestors)
    }
}

impl From<CollectionModel> for Collection {
    fn from(model: CollectionModel) -> Self {
        Self {
            name: model.name,
            id: model.id,
            path: model.path,
            parent_id: model.parent_id,
            description: model.description,
            create_time: model.create_time,
            update_time: model.update_time,
        }
    }
}

impl Collection {
    /// 创建目录
    pub(crate) fn create(
        name: &str,
        parent_id: Option<i64>,
        description: Option<String>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        match parent_id {
            None => {
                let collection_path = format!("/{name}/");
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path, conn)? {
                    event!(Level::WARN, "目录已存在: {}", collection_path);
                    return Err(GraphqlError::AlreadyExists(collection_path));
                }
                let collection =
                    CollectionModel::create(name, &collection_path, None, description, conn)?;
                Ok(collection.into())
            }

            Some(id) => {
                // 父目录不存在
                if !CollectionModel::exists(id, conn)? {
                    event!(Level::WARN, "父目录不存在: {}", id);
                    return Err(GraphqlError::NotFound("父目录", id));
                }
                let CollectionModel {
                    path: parent_path, ..
                } = CollectionModel::find_one(id, conn)?;
                let collection_path = format!("{parent_path}{name}/");
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path, conn)? {
                    event!(Level::WARN, "目录已存在: {}", collection_path);
                    return Err(GraphqlError::AlreadyExists(collection_path));
                }
                let collection =
                    CollectionModel::create(name, &collection_path, parent_id, description, conn)?;
                Ok(collection.into())
            }
        }
    }
}

/// id 相关
impl Collection {
    /// 删除目录
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        conn.transaction(|conn| {
            let collection = Self::delete_inner(id, conn)?;
            Ok(collection)
        })
    }
    /// 删除目录
    fn delete_inner(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 目录不存在
        if !CollectionModel::exists(id, conn)? {
            event!(Level::WARN, "目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        // 删除关系
        CollectionItemModel::delete_by_collection_id(id, conn)?;
        let collection = CollectionModel::delete(id, conn)?;
        //递归删除子目录
        CollectionModel::list_parent(Some(id), conn)?
            .into_iter()
            .try_for_each(|CollectionModel { id, .. }| Collection::delete(id, conn).map(|_| ()))?;
        Ok(collection.into())
    }
    /// 获取祖先目录列表
    pub(crate) fn get_ancestors(id: i64, conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
            event!(Level::WARN, "目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        let collection = CollectionModel::find_one(id, conn)?;
        let mut collections = Vec::new();
        let mut parent_id = collection.parent_id;
        while let Some(id) = parent_id {
            let collection = CollectionModel::find_one(id, conn)?;
            parent_id = collection.parent_id;
            collections.push(collection.into());
        }
        collections.reverse();
        Ok(collections)
    }
    /// 获取集合详情
    pub(crate) fn get(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
            event!(Level::WARN, "目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        let collection = CollectionModel::find_one(id, conn)?;
        Ok(collection.into())
    }
    /// 修改集合
    pub(crate) fn update(
        id: i64,
        name: &str,
        description: Option<&str>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
            event!(Level::WARN, "目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        //
        let CollectionModel {
            parent_id,
            path: old_path,
            ..
        } = CollectionModel::find_one(id, conn)?;
        // 目标子目录是否存在
        let path = match parent_id {
            None => {
                let collection_path = format!("/{name}/");
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path, conn)?
                    && collection_path != old_path
                {
                    event!(Level::WARN, "目录已存在: {}", collection_path);
                    return Err(GraphqlError::AlreadyExists(collection_path));
                }
                collection_path
            }
            Some(id) => {
                let CollectionModel {
                    path: parent_path, ..
                } = CollectionModel::find_one(id, conn)?;
                let collection_path = format!("{parent_path}{name}/");
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path, conn)?
                    && collection_path != old_path
                {
                    event!(Level::WARN, "目录已存在: {}", collection_path);
                    return Err(GraphqlError::AlreadyExists(collection_path));
                }
                collection_path
            }
        };
        let collection = CollectionModel::update(id, name, description, &path, conn)?;
        Ok(collection.into())
    }
}

pub(crate) struct CollectionQueryRunner {
    query: CollectionItemQuery,
    count: i64,
    conn: PgPool,
}

graphql_common::list!(ItemAndCollection);

impl CollectionQueryRunner {
    pub(crate) async fn new(query: CollectionItemQuery, conn: PgPool) -> GraphqlResult<Self> {
        let conn_temp = &mut conn.get()?;
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            ..
        } = query;
        //  判断父目录是否存在
        if let Some(id) = id {
            if !CollectionModel::exists(id, conn_temp)? {
                event!(Level::WARN, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        let count = CollectionModel::get_count_by_parent(id, create_time, update_time, conn_temp)?;
        Ok(Self { query, count, conn })
    }
}

/// parent id 相关
impl Queryable for CollectionQueryRunner {
    type Item = ItemAndCollection;

    type Error = GraphqlError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: Paginate>(&self, pagination: P) -> Result<Vec<Self::Item>, Self::Error> {
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            pagination: source_pagination,
        } = self.query;
        let offset = pagination.offset();
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
        //  判断父目录是否存在
        if let Some(id) = id {
            if !CollectionModel::exists(id, conn)? {
                event!(Level::WARN, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        let collections = CollectionModel::list_parent_with_page(
            id,
            create_time,
            update_time,
            offset,
            limit,
            conn,
        )?;
        Ok(collections
            .into_iter()
            .map(|d| ItemAndCollection::Collection(Collection::from(d)))
            .collect())
    }
}
