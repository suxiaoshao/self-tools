use crate::chapter::ChapterFn;

#[derive(Clone, Debug)]
pub(crate) struct QDChapter {
    novel_id: String,
    chapter_id: String,
    title: String,
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
}

impl QDChapter {
    pub(crate) fn new(novel_id: String, chapter_id: String, title: String) -> Self {
        Self {
            novel_id,
            chapter_id,
            title,
        }
    }
}
