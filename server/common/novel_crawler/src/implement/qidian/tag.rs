use crate::{QDAuthor, QDChapter, QDNovel, TagFn};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDTag {
    pub(crate) id: QDTagId,
    pub(crate) name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct QDTagId {
    pub id: u32,
    pub sub_id: Option<u32>,
}

impl TagFn for QDTag {
    type Author = QDAuthor;

    type Novel = QDNovel;

    type Chapter = QDChapter;

    type Id = QDTagId;

    fn name(&self) -> &str {
        self.name.as_str()
    }

    fn url(&self) -> String {
        match self.id.sub_id {
            Some(sub_id) => format!(
                "https://m.qidian.com/category/catid{}/subcatid{}-male/",
                self.id.id, sub_id
            ),
            None => format!("https://m.qidian.com/category/catid{}/", self.id.id),
        }
    }

    fn id(&self) -> &Self::Id {
        &self.id
    }
}
