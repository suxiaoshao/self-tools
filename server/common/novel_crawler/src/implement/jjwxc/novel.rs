use once_cell::sync::Lazy;
use scraper::Selector;

use crate::{
    errors::NovelResult,
    implement::{get_doc, parse_image_src, parse_inner_html, parse_text},
    novel::NovelFn,
};

use super::chapter::JJChapter;

static SELECTOR_NOVEL_NAME: Lazy<Selector> = Lazy::new(|| {
    Selector::parse(
        "#oneboolt > tbody > tr:nth-child(1) > td > div:nth-child(3) > span > h1 > span",
    )
    .unwrap()
});
static SELECTOR_NOVEL_DESCRIPTION: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#novelintro > font").unwrap());
static SELECTOR_NOVEL_IMAGE: Lazy<Selector> = Lazy::new(|| {
    Selector::parse(
        "body > table:nth-child(23) > tbody > tr > td:nth-child(1) > div:nth-child(2) > img",
    )
    .unwrap()
});

static SELECTOR_CHAPTER_URLS: Lazy<Selector> = Lazy::new(|| {
    Selector::parse(
        "#oneboolt > tbody > tr > td:nth-child(2) > span > div:nth-child(1) > a:nth-child(1)",
    )
    .unwrap()
});

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
        let url = format!("https://www.jjwxc.net/onebook.php?novelid={}", novel_id);
        let html = get_doc(&url).await?;
        let name = parse_inner_html(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;

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

    async fn chapters(&self) -> NovelResult<Vec<Self::Chapter>> {
        Ok(self.chapters.clone())
    }
}
