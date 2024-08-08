use crate::{JJAuthor, JJChapter, JJNovel, TagFn};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JJTag {
    pub(crate) id: String,
    pub(crate) name: String,
}

impl TagFn for JJTag {
    type Author = JJAuthor;

    type Novel = JJNovel;

    type Chapter = JJChapter;

    fn name(&self) -> &str {
        &self.name
    }

    fn url(&self) -> String {
        format!("https://www.jjwxc.net/bookbase.php?bq={}", self.id)
    }

    fn id(&self) -> &str {
        &self.id
    }
}
