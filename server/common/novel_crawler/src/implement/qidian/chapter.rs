/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-03 14:19:44
 * @FilePath: /self-tools/server/common/novel_crawler/src/implement/qidian/chapter.rs
 */
use crate::chapter::ChapterFn;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDChapter {
    novel_id: String,
    chapter_id: String,
    title: String,
    word_count: u32,
    time: String,
}

impl ChapterFn for QDChapter {
    fn url(&self) -> String {
        format!(
            "https://m.qidian.com/book/{}/{}.html",
            self.novel_id, self.chapter_id
        )
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
    fn time(&self) -> &str {
        self.time.as_str()
    }
    fn word_count(&self) -> u32 {
        self.word_count
    }
}

impl QDChapter {
    pub(crate) fn new(
        novel_id: String,
        chapter_id: String,
        title: String,
        word_count: u32,
        time: String,
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
