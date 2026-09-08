/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-27 05:39:03
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-25 13:47:09
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/chapter.rs
 */

use diesel::PgConnection;

use crate::{errors::AppResult, model::schema::custom_type::NovelSite};

pub(crate) struct Chapter {
    pub(crate) id: i64,
    pub(crate) title: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) content: Option<String>,
    pub(crate) time: time::OffsetDateTime,
    pub(crate) word_count: i64,
    pub(crate) novel_id: i64,
    pub(crate) author_id: i64,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
    pub(crate) site_novel_id: String,
    pub(crate) is_read: bool,
}

impl Chapter {
    pub(crate) fn from(value: crate::model::chapter::ChapterModel, site_novel_id: String) -> Self {
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
            create_time: value.create_time,
            update_time: value.update_time,
            site_novel_id,
            is_read: value.is_read,
        }
    }
}

/// 小说相关
impl Chapter {
    pub(crate) fn get_by_novel_id(
        novel_id: i64,
        site_novel_id: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let chapters = crate::model::chapter::ChapterModel::get_by_novel_id(novel_id, conn)?;
        Ok(chapters
            .into_iter()
            .map(|x| Chapter::from(x, site_novel_id.to_owned()))
            .collect())
    }
}
