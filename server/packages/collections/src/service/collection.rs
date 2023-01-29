use async_graphql::*;
use diesel::{Connection, PgConnection};
use time::OffsetDateTime;

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{collection::CollectionModel, item::ItemModel, CONNECTION},
};

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Collection {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub parent_id: Option<i64>,
    pub description: Option<String>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[ComplexObject]
impl Collection {
    /// 获取祖先列表
    async fn ancestors(&self) -> GraphqlResult<Vec<Collection>> {
        let ancestors = Collection::get_ancestors(self.id)?;
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
    pub fn create(
        name: &str,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        match parent_id {
            None => {
                let collection_path = format!("/{name}/");
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path, conn)? {
                    return Err(GraphqlError::AlreadyExists(collection_path));
                }
                let collection =
                    CollectionModel::create(name, &collection_path, None, description, conn)?;
                Ok(collection.into())
            }

            Some(id) => {
                // 父目录不存在
                if !CollectionModel::exists(id, conn)? {
                    return Err(GraphqlError::NotFound("父目录", id));
                }
                let CollectionModel {
                    path: parent_path, ..
                } = CollectionModel::find_one(id, conn)?;
                let collection_path = format!("{parent_path}{name}/");
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path, conn)? {
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
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        conn.transaction(|conn| {
            let collection = Self::delete_inner(id, conn)?;
            Ok(collection)
        })
    }
    /// 删除目录
    fn delete_inner(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 目录不存在
        if !CollectionModel::exists(id, conn)? {
            return Err(GraphqlError::NotFound("目录", id));
        }
        // 删除目录下的记录
        ItemModel::delete_by_collection_id(id, conn)?;
        let collection = CollectionModel::delete(id, conn)?;
        //递归删除子目录
        CollectionModel::list_parent(Some(id), conn)?
            .into_iter()
            .try_for_each(|CollectionModel { id, .. }| Collection::delete(id).map(|_| ()))?;
        Ok(collection.into())
    }
    /// 获取祖先目录列表
    pub fn get_ancestors(id: i64) -> GraphqlResult<Vec<Self>> {
        let conn = &mut CONNECTION.get()?;
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
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
    pub fn get(id: i64) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
            return Err(GraphqlError::NotFound("目录", id));
        }
        let collection = CollectionModel::find_one(id, conn)?;
        Ok(collection.into())
    }
    /// 修改集合
    pub fn update(id: i64, name: &str, description: Option<&str>) -> GraphqlResult<Self> {
        let conn = &mut CONNECTION.get()?;
        //  判断目录是否存在
        if !CollectionModel::exists(id, conn)? {
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
                    return Err(GraphqlError::AlreadyExists(collection_path));
                }
                collection_path
            }
        };
        let collection = CollectionModel::update(id, name, description, &path, conn)?;
        Ok(collection.into())
    }
}

/// parent id 相关
impl Collection {
    /// 获取目录列表
    pub fn get_list_parent_id(
        parent_id: Option<i64>,
        offset: i64,
        limit: i64,
    ) -> GraphqlResult<Vec<Self>> {
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if let Some(id) = parent_id {
            if !CollectionModel::exists(id, conn)? {
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        let collections = CollectionModel::list_parent_with_page(parent_id, offset, limit, conn)?;
        Ok(collections.into_iter().map(|d| d.into()).collect())
    }
    /// 获取目录数量
    pub fn count_parent_id(parent_id: Option<i64>) -> GraphqlResult<i64> {
        let conn = &mut CONNECTION.get()?;
        //  判断父目录是否存在
        if let Some(id) = parent_id {
            if !CollectionModel::exists(id, conn)? {
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        let count = CollectionModel::get_count_by_parent(parent_id, conn)?;
        Ok(count)
    }
}
