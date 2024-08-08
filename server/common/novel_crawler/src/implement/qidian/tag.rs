use crate::{QDAuthor, QDChapter, QDNovel, TagFn};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDTag {
    pub(crate) name: String,
}

impl TagFn for QDTag {
    type Author = QDAuthor;

    type Novel = QDNovel;

    type Chapter = QDChapter;

    fn name(&self) -> &str {
        self.name.as_str()
    }

    fn url(&self) -> String {
        format!("https://www.qidian.com/all/tag{}/", self.name)
    }

    fn id(&self) -> &str {
        &self.name
    }
}
