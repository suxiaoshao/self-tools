use async_graphql::Object;

use super::validator::DirNameValidator;
use crate::{errors::GraphqlResult, service::collection::Collection};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    async fn create_collection(
        &self,
        #[graphql(validator(custom = "DirNameValidator"))] name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> GraphqlResult<Collection> {
        let new_directory = Collection::create(&name, parent_id, description)?;
        Ok(new_directory)
    }
    /// 删除目录
    async fn delete_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let deleted_directory = Collection::delete(id)?;
        Ok(deleted_directory)
    }
}
