/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-27 05:39:03
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-25 13:47:09
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/chapter.rs
 */
use async_graphql::{ComplexObject, Context, SimpleObject};
use diesel::PgConnection;
use novel_crawler::{ChapterFn, JJChapter, QDChapter};
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{schema::custom_type::NovelSite, PgPool},
};

use super::novel::Novel;

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Chapter {
    pub id: i64,
    pub title: String,
    pub site: NovelSite,
    pub site_id: String,
    pub content: Option<String>,
    pub time: OffsetDateTime,
    pub word_count: i64,
    pub novel_id: i64,
    #[graphql(skip)]
    pub author_id: i64,
    #[graphql(skip)]
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
    pub site_novel_id: String,
}

#[ComplexObject]
impl Chapter {
    async fn novel(&self, context: &Context<'_>) -> GraphqlResult<Novel> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let novel = Novel::get(self.novel_id, conn)?;
        Ok(novel)
    }
    async fn url(&self) -> String {
        match self.site {
            NovelSite::Jjwxc => JJChapter::get_url_from_id(&self.site_id, &self.site_novel_id),
            NovelSite::Qidian => QDChapter::get_url_from_id(&self.site_id, &self.site_novel_id),
        }
    }
}

impl Chapter {
    fn from(value: crate::model::chapter::ChapterModel, site_novel_id: String) -> Self {
        Self {
            id: value.id,
            title: value.title,
            site: value.site,
            site_id: value.site_id,
            content: value.content,
            time: value.time,
            word_count: value.word_count,
            novel_id: value.novel_id,
            author_id: value.author_id,
            collection_id: value.collection_id,
            create_time: value.create_time,
            update_time: value.update_time,
            site_novel_id,
        }
    }
}

/// 小说相关
impl Chapter {
    pub fn get_by_novel_id(
        novel_id: i64,
        site_novel_id: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        let chapters = crate::model::chapter::ChapterModel::get_by_novel_id(novel_id, conn)?;
        Ok(chapters
            .into_iter()
            .map(|x| Chapter::from(x, site_novel_id.to_owned()))
            .collect())
    }
}
