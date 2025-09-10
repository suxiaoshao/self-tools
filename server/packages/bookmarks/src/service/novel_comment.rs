use async_graphql::SimpleObject;
use diesel::PgConnection;
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        novel::NovelModel,
        novel_comment::{NewNovelComment, NovelCommentModel},
    },
};

#[derive(SimpleObject, Clone)]
pub(crate) struct NovelComment {
    #[graphql(skip)]
    novel_id: i64,
    #[graphql(skip)]
    author_id: i64,
    content: String,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

impl From<NovelCommentModel> for NovelComment {
    fn from(
        NovelCommentModel {
            create_time,
            update_time,
            author_id,
            content,
            novel_id,
            ..
        }: NovelCommentModel,
    ) -> Self {
        Self {
            novel_id,
            author_id,
            content,
            create_time,
            update_time,
        }
    }
}

impl NovelComment {
    pub(crate) fn create(
        novel_id: i64,
        content: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        if NovelCommentModel::exist_by_novel_id(novel_id, conn)? {
            event!(Level::WARN, "小说评论已存在:{}", novel_id);
            return Err(GraphqlError::AlreadyExists(novel_id.to_string()));
        }
        let now = OffsetDateTime::now_utc();
        let NovelModel { author_id, .. } = NovelModel::find_one(novel_id, conn)?;
        let new_comment = NewNovelComment::new(novel_id, author_id, content, now, now);
        let new_comment = new_comment.create(conn)?;
        Ok(new_comment.into())
    }
    pub(crate) fn delete(novel_id: i64, conn: &mut PgConnection) -> GraphqlResult<NovelComment> {
        if !NovelCommentModel::exist_by_novel_id(novel_id, conn)? {
            event!(Level::WARN, "小说评论不存在:{}", novel_id);
            return Err(GraphqlError::NotFound("小说评论", novel_id));
        }
        let comment = NovelCommentModel::delete_by_novel_id(novel_id, conn)?;
        Ok(comment.into())
    }
    pub(crate) fn update(
        novel_id: i64,
        content: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<NovelComment> {
        if !NovelCommentModel::exist_by_novel_id(novel_id, conn)? {
            event!(Level::WARN, "小说评论不存在:{}", novel_id);
            return Err(GraphqlError::NotFound("小说评论", novel_id));
        }
        let now = OffsetDateTime::now_utc();
        let comment = NovelCommentModel::update(novel_id, content, now, conn)?;
        Ok(comment.into())
    }
}
