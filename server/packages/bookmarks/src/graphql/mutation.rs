/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 18:40:58
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/mutation.rs
 */
use std::collections::HashSet;

use super::{guard::AuthGuard, validator::DirNameValidator};
use async_graphql::{InputObject, Object};

use crate::{
    errors::GraphqlResult,
    service::{author::Author, collection::Collection, novel::Novel, tag::Tag},
};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    #[graphql(guard = "AuthGuard::default()")]
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
    #[graphql(guard = "AuthGuard::default()")]
    async fn delete_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let deleted_directory = Collection::delete(id)?;
        Ok(deleted_directory)
    }
    /// 创建作者
    #[graphql(guard = "AuthGuard::default()")]
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
    #[graphql(guard = "AuthGuard::default()")]
    async fn delete_author(&self, id: i64) -> GraphqlResult<Author> {
        let deleted_author = Author::delete(id)?;
        Ok(deleted_author)
    }
    /// 创建标签
    #[graphql(guard = "AuthGuard::default()")]
    async fn create_tag(&self, name: String, collection_id: Option<i64>) -> GraphqlResult<Tag> {
        let new_tag = Tag::create(&name, collection_id)?;
        Ok(new_tag)
    }
    /// 删除标签
    #[graphql(guard = "AuthGuard::default()")]
    async fn delete_tag(&self, id: i64) -> GraphqlResult<Tag> {
        let deleted_tag = Tag::delete(id)?;
        Ok(deleted_tag)
    }
    /// 创建小说
    #[graphql(guard = "AuthGuard::default()")]
    async fn create_novel(&self, data: CreateNovelInput) -> GraphqlResult<Novel> {
        let CreateNovelInput {
            name,
            author_id,
            url,
            description,
            tags,
            collection_id,
        } = data;
        Novel::create(name, author_id, url, description, tags, collection_id)
    }
    /// 删除小说
    #[graphql(guard = "AuthGuard::default()")]
    async fn delete_novel(&self, id: i64) -> GraphqlResult<Novel> {
        let deleted_novel = Novel::delete(id)?;
        Ok(deleted_novel)
    }
}

#[derive(InputObject)]
struct CreateNovelInput {
    name: String,
    author_id: i64,
    url: String,
    description: String,
    tags: HashSet<i64>,
    collection_id: Option<i64>,
}
