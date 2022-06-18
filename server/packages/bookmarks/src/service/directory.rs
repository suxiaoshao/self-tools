use async_graphql::SimpleObject;

use crate::model::directory::DirectoryModel;

#[derive(SimpleObject)]
pub struct Directory {
    pub id: i64,
    pub path: String,
    pub father_directory: Option<i64>,
    pub create_time: i64,
    pub update_time: i64,
}

impl From<DirectoryModel> for Directory {
    fn from(model: DirectoryModel) -> Self {
        Self {
            id: model.id,
            path: model.path,
            father_directory: model.father_directory,
            create_time: model.create_time.timestamp_millis(),
            update_time: model.update_time.timestamp_millis(),
        }
    }
}
