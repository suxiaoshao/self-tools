use super::validator::DirNameValidator;
use async_graphql::Object;

use crate::{errors::GraphqlResult, service::directory::Directory};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    async fn create_directory(
        &self,
        #[graphql(validator(custom = "DirNameValidator"))] dir_name: String,
        father_path: String,
    ) -> GraphqlResult<Directory> {
        let new_directory = Directory::create(&dir_name, &father_path)?;
        Ok(new_directory)
    }
    /// 删除目录
    async fn delete_directory(&self, dir_path: String) -> GraphqlResult<Directory> {
        let deleted_directory = Directory::delete(&dir_path)?;
        Ok(deleted_directory)
    }
}
