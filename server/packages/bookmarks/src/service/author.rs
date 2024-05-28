/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 11:50:52
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/author.rs
 */
use async_graphql::{ComplexObject, Context, SimpleObject};
use diesel::PgConnection;
use novel_crawler::{AuthorFn, JJAuthor, NovelFn, QDAuthor};
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        author::{AuthorModel, UpdateAuthorModel},
        chapter::{ChapterModel, NewChapter, UpdateChapterModel},
        novel::{NewNovel, NovelModel, UpdateNovelModel},
        schema::custom_type::NovelSite,
        PgPool,
    },
};

use super::novel::Novel;

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Author {
    pub id: i64,
    pub name: String,
    pub avatar: String,
    pub site: NovelSite,
    pub site_id: String,
    pub description: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

#[ComplexObject]
impl Author {
    async fn novels(&self, context: &Context<'_>) -> GraphqlResult<Vec<Novel>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let novels = NovelModel::query_by_author_id(self.id, conn)?;
        Ok(novels.into_iter().map(|x| x.into()).collect())
    }
    async fn url(&self) -> String {
        match self.site {
            NovelSite::Qidian => QDAuthor::get_url_from_id(&self.site_id),
            NovelSite::Jjwxc => JJAuthor::get_url_from_id(&self.site_id),
        }
    }
}

impl From<AuthorModel> for Author {
    fn from(value: AuthorModel) -> Self {
        Self {
            id: value.id,
            site: value.site,
            name: value.name,
            avatar: value.avatar,
            description: value.description,
            create_time: value.create_time,
            update_time: value.update_time,
            site_id: value.site_id,
        }
    }
}

impl<'a, T: AuthorFn> From<(&'a Author, &'a T)> for UpdateAuthorModel<'a> {
    fn from(value: (&'a Author, &'a T)) -> Self {
        let now = OffsetDateTime::now_utc();
        let (author, fetch_author) = value;
        Self {
            id: author.id,
            name: if fetch_author.name() == author.name {
                None
            } else {
                Some(fetch_author.name())
            },
            avatar: if fetch_author.image() == author.avatar {
                None
            } else {
                Some(fetch_author.image())
            },
            description: if fetch_author.description() == author.description {
                None
            } else {
                Some(fetch_author.description())
            },
            update_time: now,
        }
    }
}

impl Author {
    /// 创建作者
    pub fn create(
        name: &str,
        avatar: &str,
        description: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let new_author = AuthorModel::create(name, avatar, site, site_id, description, conn)?;
        Ok(new_author.into())
    }
    /// 删除作者
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(id, conn)? {
            event!(Level::WARN, "作者不存在: {}", id);
            return Err(GraphqlError::NotFound("作者", id));
        }
        conn.build_transaction().run(|conn| {
            let deleted_author = AuthorModel::delete(id, conn)?;
            NovelModel::delete_by_author_id(id, conn)?;
            ChapterModel::delete_by_author_id(id, conn)?;
            Ok(deleted_author.into())
        })
    }
    /// 获取作者列表
    pub fn query(search_name: Option<String>, conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let authors = match search_name {
            Some(search_name) => AuthorModel::get_search_list(search_name, conn)?,
            None => AuthorModel::get_list(conn)?,
        };
        Ok(authors.into_iter().map(|x| x.into()).collect())
    }
    /// 获取作者
    pub fn get(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(id, conn)? {
            event!(Level::WARN, "作者不存在: {}", id);
            return Err(GraphqlError::NotFound("作者", id));
        }
        let author = AuthorModel::get(id, conn)?;
        Ok(author.into())
    }
    /// update by crawler
    pub async fn update_by_crawler<T: novel_crawler::AuthorFn>(
        &self,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let fetch_author = T::get_author_data(&self.site_id).await?;
        let fetch_novels = fetch_author.novels().await?;
        let mut fetch_chapters = Vec::new();
        for novel in &fetch_novels {
            fetch_chapters.extend(novel.chapters().await?);
        }
        let update_author: UpdateAuthorModel = (self, &fetch_author).into();
        conn.build_transaction().run::<_, GraphqlError, _>(|conn| {
            let author = update_author.update(conn)?;

            // 获取待更新的小说，新建的小说，删除的小说
            let novels = NovelModel::query_by_author_id(author.id, conn)?;
            let (update_novels, new_noevls, delete_novels) = UpdateNovelModel::from_author(
                novels.as_slice(),
                fetch_novels.as_slice(),
                author.id,
            );

            // 更新小说
            UpdateNovelModel::update_many(update_novels.as_slice(), conn)?;
            // 新建小说
            let new_novels = NewNovel::create_many(new_noevls.as_slice(), conn)?;
            // 删除小说
            NovelModel::delete_many(delete_novels.as_slice(), conn)?;

            // 获取待更新的章节，新建的章节，删除的章节
            let chapters = ChapterModel::get_by_author_id(author.id, conn)?;
            let (update_chapters, new_chapters, delete_chapters) = UpdateChapterModel::from_author(
                chapters.as_slice(),
                fetch_chapters.as_slice(),
                new_novels.as_slice(),
                delete_novels.as_slice(),
            )?;
            // 新建章节
            UpdateChapterModel::update_many(update_chapters.as_slice(), conn)?;
            // 新建章节
            NewChapter::create_many(new_chapters.as_slice(), conn)?;
            // 删除章节
            ChapterModel::delete_by_ids(delete_chapters.as_slice(), conn)?;

            Ok(author.into())
        })
    }
}
