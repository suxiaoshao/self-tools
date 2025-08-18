/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-24 16:20:09
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/mutation.rs
 */

use super::{guard::AuthGuard, validator::DirNameValidator};
use async_graphql::{Context, Object};
use novel_crawler::{JJAuthor, JJNovel, QDAuthor, QDNovel};
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{schema::custom_type::NovelSite, PgPool},
    service::{
        author::Author,
        collection::Collection,
        novel::{CreateNovelInput, Novel},
        save_draft::SaveDraftAuthor,
        tag::Tag,
    },
};

pub(crate) struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    #[graphql(guard = "AuthGuard")]
    async fn create_collection(
        &self,
        context: &Context<'_>,
        #[graphql(validator(custom = "DirNameValidator"))] name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let new_directory = Collection::create(&name, parent_id, description, conn)?;
        Ok(new_directory)
    }
    /// 删除目录
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection(&self, context: &Context<'_>, id: i64) -> GraphqlResult<usize> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let count = Collection::delete(id, conn)?;
        Ok(count)
    }
    /// 创建作者
    #[graphql(guard = "AuthGuard")]
    async fn create_author(
        &self,
        context: &Context<'_>,
        name: String,
        avatar: String,
        description: String,
        site: NovelSite,
        site_id: String,
    ) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let new_author = Author::create(&name, &avatar, &description, site, &site_id, conn)?;
        Ok(new_author)
    }
    /// 删除作者
    #[graphql(guard = "AuthGuard")]
    async fn delete_author(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let deleted_author = Author::delete(id, conn)?;
        Ok(deleted_author)
    }
    /// 创建标签
    #[graphql(guard = "AuthGuard")]
    async fn create_tag(
        &self,
        context: &Context<'_>,
        #[graphql(validator(min_length = 2, max_length = 20))] name: String,
        site: NovelSite,
        site_id: String,
    ) -> GraphqlResult<Tag> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let new_tag = Tag::create(&name, site, &site_id, conn)?;
        Ok(new_tag)
    }
    /// 删除标签
    #[graphql(guard = "AuthGuard")]
    async fn delete_tag(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Tag> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let deleted_tag = Tag::delete(id, conn)?;
        Ok(deleted_tag)
    }
    /// 创建小说
    #[graphql(guard = "AuthGuard")]
    async fn create_novel(
        &self,
        context: &Context<'_>,
        data: CreateNovelInput,
    ) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        data.create(conn)
    }
    /// 删除小说
    #[graphql(guard = "AuthGuard")]
    async fn delete_novel(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let deleted_novel = Novel::delete(id, conn)?;
        Ok(deleted_novel)
    }
    /// 保存 draft author
    #[graphql(guard = "AuthGuard")]
    async fn save_draft_author(
        &self,
        context: &Context<'_>,
        author: SaveDraftAuthor,
    ) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        author.save(conn)
    }
    /// 通过 fetch 更新小说
    #[graphql(guard = "AuthGuard")]
    async fn update_novel_by_crawler(
        &self,
        context: &Context<'_>,
        novel_id: i64,
    ) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let novel = Novel::get(novel_id, conn)?;
        match novel.site {
            NovelSite::Qidian => novel.update_by_crawler::<QDNovel>(conn).await,
            NovelSite::Jjwxc => novel.update_by_crawler::<JJNovel>(conn).await,
        }
    }
    /// 通过 fetch 更新作者
    #[graphql(guard = "AuthGuard")]
    async fn update_author_by_crawler(
        &self,
        context: &Context<'_>,
        author_id: i64,
    ) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let author = Author::get(author_id, conn)?;
        match author.site {
            NovelSite::Qidian => author.update_by_crawler::<QDAuthor>(conn).await,
            NovelSite::Jjwxc => author.update_by_crawler::<JJAuthor>(conn).await,
        }
    }
    /// 给小说添加集合
    #[graphql(guard = "AuthGuard")]
    async fn add_collection_for_novel(
        &self,
        context: &Context<'_>,
        collection_id: i64,
        novel_id: i64,
    ) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        Novel::add_collection(collection_id, novel_id, conn)
    }
    /// 给小说删除集合
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection_for_novel(
        &self,
        context: &Context<'_>,
        collection_id: i64,
        novel_id: i64,
    ) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        Novel::delete_collection(collection_id, novel_id, conn)
    }
}
