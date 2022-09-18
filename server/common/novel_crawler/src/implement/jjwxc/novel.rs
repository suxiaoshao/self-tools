use crate::{errors::NovelResult, novel::NovelFn};

use super::chapter::JJChapter;

pub(crate) struct JJNovel {
    url: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<JJChapter>,
}

#[async_trait::async_trait]
impl NovelFn for JJNovel {
    type Chapter = JJChapter;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let url = format!("https://m.jjwxc.net/wapauthor/{}", novel_id);
        reqwest::get(url).await.unwrap().text().await.unwrap();
        todo!()
    }

    fn url(&self) -> &str {
        self.url.as_str()
    }

    fn name(&self) -> &str {
        self.name.as_str()
    }

    fn description(&self) -> &str {
        self.description.as_str()
    }

    fn image(&self) -> &str {
        self.image.as_str()
    }

    async fn chapters(&self) -> &[Self::Chapter] {
        self.chapters.as_slice()
    }
}
