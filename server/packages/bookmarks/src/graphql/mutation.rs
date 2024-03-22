/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-22 16:05:58
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/mutation.rs
 */

use super::{guard::AuthGuard, validator::DirNameValidator};
use async_graphql::{InputObject, Object};

use crate::{
    errors::GraphqlResult,
    model::schema::custom_type::NovelSite,
    service::{
        author::Author,
        collection::Collection,
        novel::{CreateNovelInput, Novel},
        tag::Tag,
    },
};

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    #[graphql(guard = "AuthGuard")]
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
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection(&self, id: i64) -> GraphqlResult<Collection> {
        let deleted_directory = Collection::delete(id)?;
        Ok(deleted_directory)
    }
    /// 创建作者
    #[graphql(guard = "AuthGuard")]
    async fn create_author(
        &self,
        name: String,
        avatar: String,
        description: String,
        site: NovelSite,
        site_id: String,
    ) -> GraphqlResult<Author> {
        let new_author = Author::create(&name, &avatar, &description, site, &site_id)?;
        Ok(new_author)
    }
    /// 删除作者
    #[graphql(guard = "AuthGuard")]
    async fn delete_author(&self, id: i64) -> GraphqlResult<Author> {
        let deleted_author = Author::delete(id)?;
        Ok(deleted_author)
    }
    /// 创建标签
    #[graphql(guard = "AuthGuard")]
    async fn create_tag(&self, name: String, collection_id: Option<i64>) -> GraphqlResult<Tag> {
        let new_tag = Tag::create(&name, collection_id)?;
        Ok(new_tag)
    }
    /// 删除标签
    #[graphql(guard = "AuthGuard")]
    async fn delete_tag(&self, id: i64) -> GraphqlResult<Tag> {
        let deleted_tag = Tag::delete(id)?;
        Ok(deleted_tag)
    }
    /// 创建小说
    #[graphql(guard = "AuthGuard")]
    async fn create_novel(&self, data: CreateNovelInput) -> GraphqlResult<Novel> {
        data.create()
    }
    /// 删除小说
    #[graphql(guard = "AuthGuard")]
    async fn delete_novel(&self, id: i64) -> GraphqlResult<Novel> {
        let deleted_novel = Novel::delete(id)?;
        Ok(deleted_novel)
    }
    /// 保存 draft author
    #[graphql(guard = "AuthGuard")]
    async fn save_draft_author(&self, author: DraftAuthorInfo) -> GraphqlResult<Author> {
        todo!()
    }
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]

struct DraftAuthorInfo {
    id: String,
    site: NovelSite,
    url: String,
    name: String,
    description: String,
    image: String,
    novels: Vec<DraftNovelInfo>,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
struct DraftNovelInfo {
    id: String,
    site: NovelSite,
    url: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<DraftChapterInfo>,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
struct DraftChapterInfo {
    id: String,
    name: String,
    novel_id: String,
    url: String,
    word_count: u32,
    time: String,
}
