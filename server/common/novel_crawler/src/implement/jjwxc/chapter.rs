use crate::chapter::ChapterFn;

#[derive(Clone)]
pub(crate) struct JJChapter {
    url: String,
    title: String,
}

impl ChapterFn for JJChapter {
    fn url(&self) -> &str {
        self.url.as_str()
    }

    fn title(&self) -> &str {
        self.title.as_str()
    }
}
