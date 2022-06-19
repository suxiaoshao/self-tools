use async_graphql::SimpleObject;

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::directory::DirectoryModel,
};

#[derive(SimpleObject)]
pub struct Directory {
    pub path: String,
    pub create_time: i64,
    pub update_time: i64,
}

impl From<DirectoryModel> for Directory {
    fn from(model: DirectoryModel) -> Self {
        Self {
            path: model.path,
            create_time: model.create_time.timestamp_millis(),
            update_time: model.update_time.timestamp_millis(),
        }
    }
}

impl Directory {
    /// 创建目录
    pub fn create(dir_name: &str, father_path: &str) -> GraphqlResult<Self> {
        // 父目录不已存在
        if !DirectoryModel::exists(father_path)? {
            return Err(GraphqlError::FatherDirNotFound);
        }
        let DirectoryModel { id, .. } = DirectoryModel::find_one(father_path)?;
        let dir_path = format!("{}{}/", father_path, dir_name);
        // 子目录已存在
        if DirectoryModel::exists(&dir_path)? {
            return Err(GraphqlError::DirAreadyExists);
        }
        let directory = DirectoryModel::create(&dir_path, id)?;
        Ok(directory.into())
    }
    /// 删除目录
    pub fn delete(path: &str) -> GraphqlResult<Self> {
        // 目录不存在
        if !DirectoryModel::exists(path)? {
            return Err(GraphqlError::DirNotFound);
        }
        let directory = DirectoryModel::delete(path)?;
        Ok(directory.into())
    }
    /// 获取目录列表
    pub fn get_list(father_path: &str) -> GraphqlResult<Vec<Self>> {
        // 目录不存在
        if !DirectoryModel::exists(father_path)? {
            return Err(GraphqlError::DirNotFound);
        }
        let father_directory = DirectoryModel::find_one(father_path)?;
        let directorys = father_directory.get_list()?;
        Ok(directorys.into_iter().map(|d| d.into()).collect())
    }
}
