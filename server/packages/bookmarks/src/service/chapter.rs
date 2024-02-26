/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-27 05:39:03
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-27 05:49:23
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/chapter.rs
 */
use async_graphql::{ComplexObject, SimpleObject};

use crate::errors::GraphqlResult;

use super::novel::Novel;

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Chapter {
    pub id: i64,
    pub title: String,
    pub url: String,
    pub content: Option<String>,
    pub novel_id: i64,
    pub create_time: i64,
    pub update_time: i64,
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
            url: value.url,
            content: value.content,
            novel_id: value.novel_id,
            create_time: value.create_time.timestamp_millis(),
            update_time: value.update_time.timestamp_millis(),
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
