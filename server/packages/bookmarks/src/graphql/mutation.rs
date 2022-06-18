use async_graphql::Object;

use crate::{
    errors::GraphqlResult, model::directory::DirectoryModel, service::directory::Directory,
};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_directory(
        &self,
        path: String,
        father_directory: Option<i64>,
    ) -> GraphqlResult<Directory> {
        let new_directory = DirectoryModel::create(&path, father_directory)?;
        Ok(new_directory.into())
    }
}
