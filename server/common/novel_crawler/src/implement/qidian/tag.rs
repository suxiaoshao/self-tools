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

    fn id(&self) -> &str {
        &self.name
    }

    fn get_url_from_id(id: &str) -> String {
        format!("https://www.qidian.com/all/tag{id}/")
    }
}
