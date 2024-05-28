use std::collections::HashSet;

use crate::model::chapter::{ChapterModel, NewChapter, UpdateChapterModel};
use crate::model::novel::UpdateNovelModel;
use crate::model::{collection::CollectionModel, schema::custom_type::NovelSite, tag::TagModel};
use crate::model::{
    novel::{NewNovel, NovelModel},
    PgPool,
};
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::schema::custom_type::NovelStatus,
};
use crate::{graphql::input::TagMatch, model::author::AuthorModel};
use async_graphql::{ComplexObject, Context, InputObject, SimpleObject};
use diesel::PgConnection;
use novel_crawler::{JJNovel, NovelFn, QDNovel};
use time::OffsetDateTime;
use tracing::{event, Level};

use super::{author::Author, tag::Tag};

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Novel {
    pub id: i64,
    pub name: String,
    pub avatar: String,
    pub description: String,
    #[graphql(skip)]
    pub author_id: i64,
    pub novel_status: NovelStatus,
    pub site: NovelSite,
    pub site_id: String,
    #[graphql(skip)]
    pub tags: Vec<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

#[ComplexObject]
impl Novel {
    async fn author(&self, context: &Context<'_>) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let author = Author::get(self.author_id, conn)?;
        Ok(author)
    }

    async fn tags(&self, context: &Context<'_>) -> GraphqlResult<Vec<Tag>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let tags = Tag::get_by_ids(&self.tags, conn)?;
        Ok(tags)
    }

    /// 获取小说章节
    async fn chapters(&self, context: &Context<'_>) -> GraphqlResult<Vec<super::chapter::Chapter>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        super::chapter::Chapter::get_by_novel_id(self.id, &self.site_id, conn)
    }
    async fn url(&self) -> String {
        match self.site {
            NovelSite::Jjwxc => JJNovel::get_url_from_id(&self.site_id),
            NovelSite::Qidian => QDNovel::get_url_from_id(&self.site_id),
        }
    }
}

impl From<NovelModel> for Novel {
    fn from(value: NovelModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            author_id: value.author_id,
            avatar: value.avatar,
            description: value.description,
            tags: value.tags,
            create_time: value.create_time,
            update_time: value.update_time,
            novel_status: value.novel_status,
            site: value.site,
            site_id: value.site_id,
        }
    }
}

impl<'a, T: NovelFn> From<(&'a Novel, &'a T)> for UpdateNovelModel<'a> {
    fn from(value: (&'a Novel, &'a T)) -> Self {
        let now = OffsetDateTime::now_utc();
        let novel = &value.0;
        let fetch_novel = &value.1;
        Self {
            id: novel.id,
            name: if fetch_novel.name() == novel.name {
                None
            } else {
                Some(fetch_novel.name())
            },
            avatar: if fetch_novel.image() == novel.avatar {
                None
            } else {
                Some(fetch_novel.image())
            },
            description: if fetch_novel.description() == novel.description {
                None
            } else {
                Some(fetch_novel.description())
            },
            novel_status: if novel.novel_status == fetch_novel.status() {
                None
            } else {
                Some(fetch_novel.status().into())
            },
            update_time: now,
        }
    }
}

impl Novel {
    /// 删除小说
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        if !NovelModel::exists(id, conn)? {
            event!(Level::WARN, "小说不存在: {}", id);
            return Err(GraphqlError::NotFound("小说", id));
        }
        let novel = conn.build_transaction().run::<_, GraphqlError, _>(|conn| {
            let novel = NovelModel::delete(id, conn)?;
            ChapterModel::delete_by_novel_id(id, conn)?;
            Ok(novel.into())
        })?;
        Ok(novel)
    }
    /// 获取小说
    pub fn get(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        if !NovelModel::exists(id, conn)? {
            event!(Level::WARN, "小说不存在: {}", id);
            return Err(GraphqlError::NotFound("小说", id));
        }
        let novel = NovelModel::find_one(id, conn)?;
        Ok(novel.into())
    }
    /// update by crawler
    pub async fn update_by_crawler<T: novel_crawler::NovelFn>(
        &self,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let fetch_novel = T::get_novel_data(&self.site_id).await?;
        let fetch_chapters = fetch_novel.chapters().await?;
        let update_novel: UpdateNovelModel = (self, &fetch_novel).into();
        conn.build_transaction().run::<_, GraphqlError, _>(|conn| {
            // 更新小说
            let novel = update_novel.update(conn)?;

            // 获取待更新章节，新章节，删除章节
            let chapters = ChapterModel::get_by_novel_id(novel.id, conn)?;
            let (update_chapters, new_chapters, delete_chapter_ids) =
                UpdateChapterModel::from_novel(
                    chapters.as_slice(),
                    fetch_chapters.as_slice(),
                    novel.id,
                    novel.author_id,
                );

            // 更新章节
            UpdateChapterModel::update_many(update_chapters.as_slice(), conn)?;
            // 新增章节
            NewChapter::create_many(new_chapters.as_slice(), conn)?;
            // 删除章节
            ChapterModel::delete_by_ids(delete_chapter_ids.as_slice(), conn)?;
            Ok(novel.into())
        })
    }
}

/// collection_id 相关
impl Novel {
    /// 选择小说
    pub fn query(
        collection_id: Option<i64>,
        tag_match: Option<TagMatch>,
        novel_status: Option<NovelStatus>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id, conn)? {
                event!(Level::WARN, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        if let Some(TagMatch { match_set, .. }) = &tag_match {
            // tag 不存在
            TagModel::exists_all(match_set.iter(), conn)?;
        }
        let data = NovelModel::query(tag_match, novel_status, conn)?
            .into_iter()
            .map(Into::into)
            .collect();
        // todo!("collection_id 相关");
        Ok(data)
    }
}

#[derive(InputObject)]
pub struct CreateNovelInput {
    name: String,
    avatar: String,
    description: String,
    author_id: i64,
    novel_status: NovelStatus,
    site: NovelSite,
    site_id: String,
    tags: HashSet<i64>,
}

impl CreateNovelInput {
    pub fn create(self, conn: &mut PgConnection) -> GraphqlResult<Novel> {
        // 作者不存在
        if !AuthorModel::exists(self.author_id, conn)? {
            event!(Level::WARN, "作者不存在: {}", self.author_id);
            return Err(GraphqlError::NotFound("作者", self.author_id));
        }
        // tag 不存在
        TagModel::exists_all(self.tags.iter(), conn)?;
        let new_novel = self.to_new_novel().create(conn)?;
        Ok(new_novel.into())
    }
    fn to_new_novel(&self) -> NewNovel<'_> {
        let now = time::OffsetDateTime::now_utc();
        let CreateNovelInput {
            name,
            avatar,
            description,
            author_id,
            novel_status,
            site,
            site_id,
            tags,
        } = self;
        let tags = tags.iter().copied().collect::<Vec<_>>();
        NewNovel {
            name,
            avatar,
            description,
            author_id: *author_id,
            novel_status: *novel_status,
            site: *site,
            site_id,
            tags,
            create_time: now,
            update_time: now,
        }
    }
}
