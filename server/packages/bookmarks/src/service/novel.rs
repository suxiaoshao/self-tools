use std::collections::HashSet;

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

use super::{author::Author, collection::Collection, tag::Tag};

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
    #[graphql(skip)]
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

#[ComplexObject]
impl Novel {
    async fn author(&self, context: &Context<'_>) -> GraphqlResult<Author> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| GraphqlError::NotGraphqlContextData("PgPool"))?
            .get()?;
        let author = Author::get(self.author_id, conn)?;
        Ok(author)
    }

    async fn tags(&self, context: &Context<'_>) -> GraphqlResult<Vec<Tag>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| GraphqlError::NotGraphqlContextData("PgPool"))?
            .get()?;
        let tags = Tag::get_by_ids(&self.tags, conn)?;
        Ok(tags)
    }

    async fn collection(&self, context: &Context<'_>) -> GraphqlResult<Option<Collection>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| GraphqlError::NotGraphqlContextData("PgPool"))?
            .get()?;
        if let Some(collection_id) = self.collection_id {
            let collection = Collection::get(collection_id, conn)?;
            Ok(Some(collection))
        } else {
            Ok(None)
        }
    }

    /// 获取小说章节
    async fn chapters(&self, context: &Context<'_>) -> GraphqlResult<Vec<super::chapter::Chapter>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| GraphqlError::NotGraphqlContextData("PgPool"))?
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
            collection_id: value.collection_id,
            create_time: value.create_time,
            update_time: value.update_time,
            novel_status: value.novel_status,
            site: value.site,
            site_id: value.site_id,
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
        let novel = NovelModel::delete(id, conn)?;
        Ok(novel.into())
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
            // tags 都属于 collection_id
            TagModel::belong_to_collection(collection_id, match_set.iter(), conn)?;
        }
        let data = NovelModel::query(collection_id, tag_match, novel_status, conn)?
            .into_iter()
            .map(Into::into)
            .collect();
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
    collection_id: Option<i64>,
}

impl CreateNovelInput {
    pub fn create(self, conn: &mut PgConnection) -> GraphqlResult<Novel> {
        // 作者不存在
        if !AuthorModel::exists(self.author_id, conn)? {
            event!(Level::WARN, "作者不存在: {}", self.author_id);
            return Err(GraphqlError::NotFound("作者", self.author_id));
        }
        //  判断父目录是否存在
        if let Some(id) = self.collection_id {
            if !CollectionModel::exists(id, conn)? {
                event!(Level::WARN, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        // tag 不存在
        TagModel::exists_all(self.tags.iter(), conn)?;
        // tags 都属于 collection_id
        TagModel::belong_to_collection(self.collection_id, self.tags.iter(), conn)?;
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
            collection_id,
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
            collection_id: *collection_id,
            create_time: now,
            update_time: now,
        }
    }
}
