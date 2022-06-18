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
    // 父目录已存在
    pub fn create(path: &str, father_directory: &str) -> GraphqlResult<Self> {
        if !DirectoryModel::exists(father_directory)? {
            return Err(GraphqlError::FatherDirPathNotFound);
        }
        let DirectoryModel { id, .. } = DirectoryModel::find_one(father_directory)?;
        if DirectoryModel::exists(path)? {
            return Err(GraphqlError::DirPathExists);
        }
        let directory = DirectoryModel::create(path, id)?;
        Ok(directory.into())
    }
}
