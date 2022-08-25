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
    pub author_id: i64,
    pub read_chapter_id: Option<i64>,
    pub description: String,
    pub tags: Vec<i64>,
    pub collection_id: i64,
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
        tags: Vec<i64>,
        collection_id: i64,
    ) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(author_id)? {
            return Err(GraphqlError::NotFound("作者", author_id));
        }
        // 集合不存在
        if !CollectionModel::exists(collection_id)? {
            return Err(GraphqlError::NotFound("集合", collection_id));
        }
        // tag 不存在
        Tag::exists_all(&tags)?;
        // 存在不符合的 tags
        let allow_tags = Tag::get_recursion_id(Some(collection_id))?;
        for tag in tags.iter() {
            if !allow_tags.contains(tag) {
                return Err(GraphqlError::Scope {
                    sub_tag: "标签",
                    sub_value: *tag,
                    super_tag: "集合",
                    super_value: collection_id,
                });
            }
        }
        let new_novel = NovelModel::create(
            &name,
            author_id,
            None,
            &description,
            &tags,
            collection_id,
            ReadStatus::Unread,
        )?;
        Ok(new_novel.into())
    }
}
