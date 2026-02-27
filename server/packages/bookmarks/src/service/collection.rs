use std::collections::HashSet;

use async_graphql::*;
use diesel::PgConnection;
use graphql_common::{Queryable, list};
use time::OffsetDateTime;
use tracing::{Level, event};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{PgPool, collection::CollectionModel, collection_novel::CollectionNovelModel},
};

use super::utils::find_all_children;

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
    /// 获取子列表
    async fn children(&self, context: &Context<'_>) -> GraphqlResult<Vec<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let children = Collection::get_list_parent_id(Some(self.id), conn)?;
        Ok(children)
    }
}

impl From<CollectionModel> for Collection {
    fn from(model: CollectionModel) -> Self {
        Self {
            path: model.path,
            name: model.name,
            id: model.id,
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
    /// 根据 novel id 获取列表
    pub(crate) fn many_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        let collection_ids = CollectionNovelModel::many_by_novel_id(novel_id, conn)?;
        let data = CollectionModel::many_by_ids(&collection_ids, conn)?;
        Ok(data.into_iter().map(From::from).collect())
    }
    /// 获取所有 collections
    pub(crate) fn all_collections(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let data = CollectionModel::get_list(conn)?;
        Ok(data.into_iter().map(From::from).collect())
    }
}

/// id 相关
impl Collection {
    /// 删除目录
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<usize> {
        // 目录不存在
        if !CollectionModel::exists(id, conn)? {
            event!(Level::WARN, "目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        // 构建一个 `id` 到其子节点列表的映射
        let lookup = CollectionModel::get_map(conn)?;
        // 初始化结果列表，并调用递归函数
        let mut ids = HashSet::new();
        ids.insert(id);
        find_all_children(&mut ids, id, &lookup);
        conn.build_transaction().run(|conn| {
            CollectionNovelModel::delete_by_collection_ids(&ids, conn)?;
            let count = CollectionModel::delete_list(&ids, conn)?;
            Ok(count)
        })
    }
    /// 获取目录列表
    pub(crate) fn get_list_parent_id(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = parent_id
            && !CollectionModel::exists(id, conn)?
        {
            event!(Level::WARN, "父目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        let collections = CollectionModel::get_list_by_parent(parent_id, conn)?;
        Ok(collections.into_iter().map(|d| d.into()).collect())
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
    /// 更新目录
    pub(crate) fn update(
        id: i64,
        name: &str,
        parent_id: Option<i64>,
        description: Option<&str>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
            event!(Level::WARN, "目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        //  判断父目录是否存在
        if let Some(id) = parent_id
            && !CollectionModel::exists(id, conn)?
        {
            event!(Level::WARN, "父目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        let collection = CollectionModel::update(id, name, parent_id, description, conn)?;
        Ok(collection.into())
    }
}

pub(crate) struct CollectionRunner {
    conn: PgPool,
    count: i64,
    parent_id: Option<i64>,
}

list!(Collection);

impl CollectionRunner {
    pub(crate) fn new(conn: PgPool, parent_id: Option<i64>) -> GraphqlResult<Self> {
        let conn_temp = &mut conn.get()?;
        let count = CollectionModel::get_count(parent_id, conn_temp)?;
        Ok(Self {
            conn,
            count,
            parent_id,
        })
    }
}

impl Queryable for CollectionRunner {
    type Item = Collection;

    type Error = GraphqlError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: graphql_common::Paginate>(
        &self,
        pagination: P,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();
        let len = self.len().await?;
        if len < offset {
            event!(
                Level::ERROR,
                "偏移量超出范围 pagination: {:?} len: {} offset: {}",
                pagination,
                len,
                offset
            );
            return Err(GraphqlError::PageSizeTooMore);
        }
        let limit = pagination.limit();
        let conn = &mut self.conn.get()?;
        //  判断父目录是否存在
        if let Some(id) = self.parent_id
            && !CollectionModel::exists(id, conn)?
        {
            event!(Level::WARN, "父目录不存在: {}", id);
            return Err(GraphqlError::NotFound("目录", id));
        }
        let collections =
            CollectionModel::list_by_parent_with_page(self.parent_id, offset, limit, conn)?;
        Ok(collections.into_iter().map(Into::into).collect())
    }
}
