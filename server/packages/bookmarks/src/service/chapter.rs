/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-27 05:39:03
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-13 00:51:20
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/chapter.rs
 */
use async_graphql::{ComplexObject, SimpleObject};
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
}

#[ComplexObject]
impl Chapter {
    async fn novel(&self) -> GraphqlResult<Novel> {
        let novel = Novel::get(self.novel_id)?;
        Ok(novel)
    }
}

impl From<crate::model::chapter::ChapterModel> for Chapter {
    fn from(value: crate::model::chapter::ChapterModel) -> Self {
        Self {
            id: value.id,
            title: value.title,
            site: value.site,
            site_id: value.site_id,
            content: value.content,
            novel_id: value.novel_id,
            create_time: value.create_time,
            update_time: value.update_time,
        }
    }
}

/// 小说相关
impl Chapter {
    pub fn get_by_novel_id(novel_id: i64) -> GraphqlResult<Vec<Self>> {
        let chapters = crate::model::chapter::ChapterModel::get_by_novel_id(novel_id)?;
        Ok(chapters.into_iter().map(|x| x.into()).collect())
    }
}
