/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-30 23:15:24
 * @FilePath: /self-tools/server/common/novel_crawler/src/implement/qidian/chapter.rs
 */
use crate::chapter::ChapterFn;
use time::OffsetDateTime;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDChapter {
    novel_id: String,
    chapter_id: String,
    title: String,
    word_count: u32,
    time: OffsetDateTime,
}

impl ChapterFn for QDChapter {
    type Author = crate::implement::qidian::author::QDAuthor;
    type Novel = crate::implement::qidian::novel::QDNovel;
    fn url(&self) -> String {
        Self::get_url_from_id(&self.chapter_id, &self.novel_id)
    }

    fn title(&self) -> &str {
        self.title.as_str()
    }
    fn chapter_id(&self) -> &str {
        self.chapter_id.as_str()
    }
    fn novel_id(&self) -> &str {
        self.novel_id.as_str()
    }
    fn time(&self) -> OffsetDateTime {
        self.time
    }
    fn word_count(&self) -> u32 {
        self.word_count
    }
    fn get_url_from_id(chapter_id: &str, novel_id: &str) -> String {
        format!("https://m.qidian.com/book/{novel_id}/{chapter_id}.html")
    }
}

impl QDChapter {
    pub(crate) fn new(
        novel_id: String,
        chapter_id: String,
        title: String,
        word_count: u32,
        time: OffsetDateTime,
    ) -> Self {
        Self {
            novel_id,
            chapter_id,
            title,
            word_count,
            time,
        }
    }
}
