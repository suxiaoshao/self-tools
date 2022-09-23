use crate::chapter::ChapterFn;

#[derive(Clone)]
pub(crate) struct JJChapter {
    novel_id: String,
    chapter_id: String,
    title: String,
}

impl JJChapter {
    pub(crate) fn new(novel_id: String, chapter_id: String, title: String) -> Self {
        Self {
            novel_id,
            chapter_id,
            title,
        }
    }
}

impl ChapterFn for JJChapter {
    fn url(&self) -> String {
        format!(
            "https://www.jjwxc.net/onebook.php?novelid={}&chapterid={}",
            self.novel_id, self.chapter_id
        )
    }

    fn title(&self) -> &str {
        self.title.as_str()
    }
}
