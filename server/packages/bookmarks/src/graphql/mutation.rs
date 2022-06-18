use async_graphql::Object;

use crate::{errors::GraphqlResult, service::directory::Directory};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_directory(
        &self,
        path: String,
        father_directory: String,
    ) -> GraphqlResult<Directory> {
        let new_directory = Directory::create(&path, &father_directory)?;
        Ok(new_directory)
    }
}
