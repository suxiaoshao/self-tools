use super::validator::DirNameValidator;
use async_graphql::Object;

use crate::{errors::GraphqlResult, service::directory::Directory};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_directory(
        &self,
        #[graphql(validator(custom = "DirNameValidator"))] dir_name: String,
        father_path: String,
    ) -> GraphqlResult<Directory> {
        let new_directory = Directory::create(&dir_name, &father_path)?;
        Ok(new_directory)
    }
}
