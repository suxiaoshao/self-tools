use std::collections::HashSet;

use crate::errors::{GraphqlError, GraphqlResult};
use crate::model::author::AuthorModel;
use crate::model::collection::CollectionModel;
use crate::model::novel::NovelModel;
use crate::model::schema::ReadStatus;
use crate::service::tag::Tag;
use async_graphql::SimpleObject;

#[derive(SimpleObject)]
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
        description: String,
        tags: HashSet<i64>,
        collection_id: Option<i64>,
    ) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(author_id)? {
            return Err(GraphqlError::NotFound("作者", author_id));
        }
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
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
            None,
            &description,
            &tags.into_iter().collect::<Vec<_>>(),
            collection_id,
            ReadStatus::Unread,
        )?;
        Ok(new_novel.into())
    }
    /// 删除小说
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        if !NovelModel::exists(id)? {
            return Err(GraphqlError::NotFound("小说", id));
        }
        let novel = NovelModel::delete(id)?;
        Ok(novel.into())
    }
    /// 获取小说
    pub fn get(id: i64) -> GraphqlResult<Self> {
        if !NovelModel::exists(id)? {
            return Err(GraphqlError::NotFound("小说", id));
        }
        let novel = NovelModel::find_one(id)?;
        Ok(novel.into())
    }
    /// 选择小说
    pub fn query(
        collection_id: Option<i64>,
        tags: HashSet<i64>,
        tag_full_match: bool,
        read_status: Option<ReadStatus>,
    ) -> GraphqlResult<Vec<Self>> {
        //  判断父目录是否存在
        if let Some(id) = collection_id {
            if !CollectionModel::exists(id)? {
                return Err(GraphqlError::NotFound("目录", id));
            }
        }
        // tag 不存在
        Tag::exists_all(tags.iter())?;
        // tags 都属于 collection_id
        Tag::belong_to_collection(collection_id, tags.iter())?;
        let data = NovelModel::query(collection_id, tags, tag_full_match, read_status)?
            .into_iter()
            .map(Into::into)
            .collect();
        Ok(data)
    }
}
