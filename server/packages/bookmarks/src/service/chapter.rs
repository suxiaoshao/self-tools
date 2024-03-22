/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-27 05:39:03
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-16 04:09:38
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/chapter.rs
 */
use async_graphql::{ComplexObject, SimpleObject};
use novel_crawler::{ChapterFn, JJChapter, QDChapter};
use time::OffsetDateTime;

use crate::{errors::GraphqlResult, model::schema::custom_type::NovelSite};

use super::novel::Novel;

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Chapter {
    pub id: i64,
    pub title: String,
    pub site: NovelSite,
    pub site_id: String,
    pub content: Option<String>,
    pub novel_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
    pub site_novel_id: String,
}

#[ComplexObject]
impl Chapter {
    async fn novel(&self) -> GraphqlResult<Novel> {
        let novel = Novel::get(self.novel_id)?;
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
            novel_id: value.novel_id,
            create_time: value.create_time,
            update_time: value.update_time,
            site_novel_id,
        }
    }
}

/// 小说相关
impl Chapter {
    pub fn get_by_novel_id(novel_id: i64, site_novel_id: &str) -> GraphqlResult<Vec<Self>> {
        let chapters = crate::model::chapter::ChapterModel::get_by_novel_id(novel_id)?;
        Ok(chapters
            .into_iter()
            .map(|x| Chapter::from(x, site_novel_id.to_owned()))
            .collect())
    }
}
