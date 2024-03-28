/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:39:00
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/mutation.rs
 */

use std::collections::HashMap;

use super::{guard::AuthGuard, validator::DirNameValidator};
use async_graphql::{Context, InputObject, Object};
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        chapter::NewChapter,
        novel::NewNovel,
        schema::custom_type::{NovelSite, NovelStatus},
        PgPool,
    },
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
    async fn delete_collection(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let deleted_directory = Collection::delete(id, conn)?;
        Ok(deleted_directory)
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
        name: String,
        collection_id: Option<i64>,
    ) -> GraphqlResult<Tag> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let new_tag = Tag::create(&name, collection_id, conn)?;
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
        let SaveDraftAuthor {
            id,
            site,
            name,
            description,
            image,
            novels,
            ..
        } = author;
        let author = conn
            .build_transaction()
            .run::<Author, GraphqlError, _>(|conn| {
                let now = OffsetDateTime::now_utc();
                // 保存作者
                let author = Author::create(&name, &image, &description, site, &id, conn)?;
                // 保存小说
                let new_novels = novels
                    .iter()
                    .map(
                        |SaveNovelInfo {
                             id,
                             site,
                             name,
                             description,
                             image,

                             novel_status,
                             ..
                         }| {
                            NewNovel {
                                name,
                                avatar: image,
                                description,
                                author_id: author.id,
                                novel_status: *novel_status,
                                site: *site,
                                site_id: id,
                                tags: Vec::new(),
                                collection_id: None,
                                create_time: now,
                                update_time: now,
                            }
                        },
                    )
                    .collect::<Vec<_>>();
                let new_novels = NewNovel::create_many(&new_novels, conn)?;
                // 保存章节
                let new_novels = new_novels
                    .into_iter()
                    .map(|novel| (novel.site_id, novel.id))
                    .collect::<HashMap<String, i64>>();
                let mut new_chapters = vec![];
                for novel in novels.iter() {
                    let SaveNovelInfo { id, chapters, .. } = novel;
                    let novel_id = match new_novels.get(id) {
                        Some(data) => data,
                        None => {
                            event!(Level::ERROR, "site id:{} 没保存到", id);
                            return Err(GraphqlError::SavaDraftError("chapter-novel"));
                        }
                    };
                    for SaveChapterInfo { name, id, .. } in chapters.iter() {
                        let new_chapter = NewChapter {
                            title: name,
                            site,
                            site_id: id,
                            content: None,
                            novel_id: *novel_id,
                            create_time: now,
                            update_time: now,
                        };
                        new_chapters.push(new_chapter);
                    }
                }
                NewChapter::create_many(&new_chapters, conn)?;
                Ok(author)
            })?;
        Ok(author)
    }
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]

struct SaveDraftAuthor {
    id: String,
    site: NovelSite,
    url: String,
    name: String,
    description: String,
    image: String,
    novels: Vec<SaveNovelInfo>,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
struct SaveNovelInfo {
    id: String,
    site: NovelSite,
    url: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<SaveChapterInfo>,
    novel_status: NovelStatus,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
struct SaveChapterInfo {
    id: String,
    name: String,
    novel_id: String,
    url: String,
    word_count: u32,
    time: String,
}
