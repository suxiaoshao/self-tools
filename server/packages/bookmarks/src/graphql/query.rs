use async_graphql::Object;

use crate::{errors::GraphqlResult, service::directory::Directory};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录列表
    async fn get_directory_list(&self, father_path: String) -> GraphqlResult<Vec<Directory>> {
        let directory = Directory::get_list(&father_path)?;
        Ok(directory)
    }
}
