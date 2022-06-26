use async_graphql::{ComplexObject, SimpleObject};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::collection::CollectionModel,
};

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Collection {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub parent_id: Option<i64>,
    pub description: Option<String>,
    pub create_time: i64,
    pub update_time: i64,
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
            path: model.path,
            name: model.name,
            id: model.id,
            parent_id: model.parent_id,
            description: model.description,
            create_time: model.create_time.timestamp_millis(),
            update_time: model.update_time.timestamp_millis(),
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
        match parent_id {
            None => {
                let collection_path = format!("/{}/", name);
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path)? {
                    return Err(GraphqlError::DirAreadyExists);
                }
                let collection =
                    CollectionModel::create(name, &collection_path, None, description)?;
                Ok(collection.into())
            }
            Some(id) => {
                // 父目录不存在
                if !CollectionModel::exists(id)? {
                    return Err(GraphqlError::NotFound("父目录"));
                }
                let CollectionModel {
                    path: parent_path, ..
                } = CollectionModel::find_one(id)?;
                let collection_path = format!("{}{}/", parent_path, name);
                // 子目录已存在
                if CollectionModel::exists_by_path(&collection_path)? {
                    return Err(GraphqlError::DirAreadyExists);
                }
                let collection =
                    CollectionModel::create(name, &collection_path, parent_id, description)?;
                Ok(collection.into())
            }
        }
    }
}

/// id 相关
impl Collection {
    /// 删除目录
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        // 目录不存在
        if !CollectionModel::exists(id)? {
            return Err(GraphqlError::NotFound("目录"));
        }
        let collection = CollectionModel::delete(id)?;
        //递归删除子目录
        CollectionModel::get_list_by_parent(Some(id))?
            .into_iter()
            .try_for_each(|CollectionModel { id, .. }| Collection::delete(id).map(|_| ()))?;
        Ok(collection.into())
    }
    /// 获取目录列表
    pub fn get_list_parent_id(parent_id: Option<i64>) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = parent_id {
            if !CollectionModel::exists(id)? {
                return Err(GraphqlError::NotFound("目录"));
            }
        }
        let collections = CollectionModel::get_list_by_parent(parent_id)?;
        Ok(collections.into_iter().map(|d| d.into()).collect())
    }
    /// 获取祖先目录列表
    pub fn get_ancestors(id: i64) -> GraphqlResult<Vec<Self>> {
        //  判断目录是否存在
        if !CollectionModel::exists(id)? {
            return Err(GraphqlError::NotFound("目录"));
        }
        let collection = CollectionModel::find_one(id)?;
        let mut collections = Vec::new();
        let mut parent_id = collection.parent_id;
        while let Some(id) = parent_id {
            let collection = CollectionModel::find_one(id)?;
            parent_id = collection.parent_id;
            collections.push(collection.into());
        }
        collections.reverse();
        Ok(collections)
    }
    /// 获取集合详情
    pub fn get(id: i64) -> GraphqlResult<Self> {
        //  判断目录是否存在
        if !CollectionModel::exists(id)? {
            return Err(GraphqlError::NotFound("目录"));
        }
        let collection = CollectionModel::find_one(id)?;
        Ok(collection.into())
    }
}
