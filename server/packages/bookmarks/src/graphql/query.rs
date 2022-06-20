use async_graphql::Object;

use crate::{
    errors::GraphqlResult,
    service::{author::Author, directory::Directory},
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// 获取目录列表
    async fn get_directory_list(&self, father_path: String) -> GraphqlResult<Vec<Directory>> {
        let directory = Directory::get_list(&father_path)?;
        Ok(directory)
    }
    /// 获取作者列表
    async fn get_author_list(&self) -> GraphqlResult<Vec<Author>> {
        let author = Author::get_list()?;
        Ok(author)
    }
}
