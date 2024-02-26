use std::collections::HashSet;

use crate::model::collection::CollectionModel;
use crate::model::novel::NovelModel;
use crate::service::tag::Tag;
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::schema::custom_type::ReadStatus,
};
use crate::{graphql::input::TagMatch, model::author::AuthorModel};
use async_graphql::{ComplexObject, SimpleObject};
use tracing::{event, Level};

use super::{author::Author, collection::Collection};

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Novel {
    pub id: i64,
    pub name: String,
    #[graphql(skip)]
    pub author_id: i64,
    #[graphql(skip)]
    pub read_chapter_id: Option<i64>,
    pub description: String,
    #[graphql(skip)]
    pub tags: Vec<i64>,
    #[graphql(skip)]
    pub collection_id: Option<i64>,
    pub status: ReadStatus,
    pub create_time: i64,
    pub update_time: i64,
}

#[ComplexObject]
impl Novel {
    async fn author(&self) -> GraphqlResult<Author> {
        let author = Author::get(self.author_id)?;
        Ok(author)
    }

    async fn tags(&self) -> GraphqlResult<Vec<Tag>> {
        let tags = Tag::get_by_ids(&self.tags)?;
        Ok(tags)
    }

    async fn collection(&self) -> GraphqlResult<Option<Collection>> {
        if let Some(collection_id) = self.collection_id {
            let collection = Collection::get(collection_id)?;
            Ok(Some(collection))
        } else {
            Ok(None)
        }
    }

    /// 获取小说章节
    async fn chapters(&self) -> GraphqlResult<Vec<super::chapter::Chapter>> {
        super::chapter::Chapter::get_by_novel_id(self.id)
    }
}

impl From<NovelModel> for Novel {
    fn from(value: NovelModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            author_id: value.author_id,
            read_chapter_id: value.read_chapter_id,
            description: value.description,
            tags: value.tags,
            collection_id: value.collection_id,
            status: value.status,
            create_time: value.create_time.timestamp_millis(),
            update_time: value.update_time.timestamp_millis(),
        }
    }
}

impl Novel {
    /// 创建小说
    pub fn create(
        name: String,
        author_id: i64,
        url: String,
        description: String,
        tags: HashSet<i64>,
        collection_id: Option<i64>,
    ) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(author_id)? {
            event!(Level::WARN, "作者不存在: {}", author_id);
            return Err(GraphqlError::NotFound("作者", author_id));
        }
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
                event!(Level::WARN, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        // tag 不存在
        Tag::exists_all(tags.iter())?;
        // tags 都属于 collection_id
        Tag::belong_to_collection(collection_id, tags.iter())?;
        let new_novel = NovelModel::create(
            &name,
            author_id,
            &url,
            &description,
            &tags.into_iter().collect::<Vec<_>>(),
            collection_id,
        )?;
        Ok(new_novel.into())
    }
    /// 删除小说
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        if !NovelModel::exists(id)? {
            event!(Level::WARN, "小说不存在: {}", id);
            return Err(GraphqlError::NotFound("小说", id));
        }
        let novel = NovelModel::delete(id)?;
        Ok(novel.into())
    }
    /// 获取小说
    pub fn get(id: i64) -> GraphqlResult<Self> {
        if !NovelModel::exists(id)? {
            event!(Level::WARN, "小说不存在: {}", id);
            return Err(GraphqlError::NotFound("小说", id));
        }
        let novel = NovelModel::find_one(id)?;
        Ok(novel.into())
    }
}

/// collection_id 相关
impl Novel {
    /// 选择小说
    pub fn query(
        collection_id: Option<i64>,
        tag_match: Option<TagMatch>,
        read_status: Option<ReadStatus>,
    ) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
                event!(Level::WARN, "目录不存在: {}", id);
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        if let Some(TagMatch { match_set, .. }) = &tag_match {
            // tag 不存在
            Tag::exists_all(match_set.iter())?;
            // tags 都属于 collection_id
            Tag::belong_to_collection(collection_id, match_set.iter())?;
        }
        let data = NovelModel::query(collection_id, tag_match, read_status)?
            .into_iter()
            .map(Into::into)
            .collect();
        Ok(data)
    }
    /// 根据 collection_id 删除小说
    pub fn delete_by_collection_id(collection_id: i64) -> GraphqlResult<()> {
        NovelModel::delete_by_collection_id(collection_id)?;
        Ok(())
    }
}
