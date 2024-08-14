use std::collections::HashMap;

use async_graphql::*;
use diesel::PgConnection;
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{collection::CollectionModel, collection_novel::CollectionNovelModel, PgPool},
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
        let all_collections = CollectionModel::get_list(conn)?;
        // 构建一个 `id` 到其子节点列表的映射
        let mut lookup: HashMap<i64, Vec<i64>> = HashMap::new();

        for collection in all_collections {
            if let Some(parent_id) = collection.parent_id {
                lookup.entry(parent_id).or_default().push(collection.id);
            }
        }
        // 初始化结果列表，并调用递归函数
        let mut ids = Vec::new();
        fn find_all_children(ids: &mut Vec<i64>, id: i64, lookup: &HashMap<i64, Vec<i64>>) {
            if let Some(children) = lookup.get(&id) {
                for &child_id in children {
                    ids.push(child_id);
                    find_all_children(ids, child_id, lookup);
                }
            }
        }
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
        if let Some(id) = parent_id {
            if !CollectionModel::exists(id, conn)? {
                event!(Level::WARN, "父目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
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
}
