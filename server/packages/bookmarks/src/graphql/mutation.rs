use super::validator::DirNameValidator;
use async_graphql::Object;

use crate::{
    errors::GraphqlResult,
    service::{author::Author, directory::Directory, tag::Tag},
};

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
    /// 创建作者
    async fn create_author(
        &self,
        #[graphql(validator(url))] url: String,
        name: String,
        #[graphql(validator(url))] avatar: String,
        description: String,
    ) -> GraphqlResult<Author> {
        let new_author = Author::create(&url, &name, &avatar, &description)?;
        Ok(new_author)
    }
    /// 删除作者
    async fn delete_author(&self, id: i64) -> GraphqlResult<Author> {
        let deleted_author = Author::delete(id)?;
        Ok(deleted_author)
    }
    /// 创建标签
    async fn create_tag(&self, name: String, directory_id: Option<i64>) -> GraphqlResult<Tag> {
        let new_tag = Tag::create(&name, directory_id)?;
        Ok(new_tag)
    }
    /// 删除标签
    async fn delete_tag(&self, id: i64) -> GraphqlResult<Tag> {
        let deleted_tag = Tag::delete(id)?;
        Ok(deleted_tag)
    }
}
