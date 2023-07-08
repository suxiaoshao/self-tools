use once_cell::sync::Lazy;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};

use crate::{
    errors::NovelResult,
    implement::{parse_image_src, parse_text, text_from_url},
    novel::NovelFn,
};

use super::chapter::QDChapter;

static SELECTOR_NOVEL_NAME: Lazy<Selector> =
    Lazy::new(|| Selector::parse("h1.header-back-title").unwrap());
static SELECTOR_NOVEL_DESCRIPTION: Lazy<Selector> =
    Lazy::new(|| Selector::parse("content.detail__summary__content").unwrap());
static SELECTOR_NOVEL_IMAGE: Lazy<Selector> =
    Lazy::new(|| Selector::parse("img.detail__header-bg").unwrap());
static SELECTOR_NOVEL_CHAPTERS: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#vite-plugin-ssr_pageContext").unwrap());

#[derive(Debug)]
pub(crate) struct QDNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<QDChapter>,
}

#[async_trait::async_trait]
impl NovelFn for QDNovel {
    type Chapter = QDChapter;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let (html, chapter_html) = Self::get_doc(novel_id).await?;
        let html = Html::parse_document(&html);
        let name = parse_text(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let image = format!("https:{image}");
        let chapters = parse_chapters(&chapter_html, novel_id)?;
        dbg!(&chapters);
        Ok(Self {
            id: novel_id.to_string(),
            name,
            description,
            image,
            chapters,
        })
    }

    fn url(&self) -> String {
        format!("https://m.qidian.com/book/{}.html", self.id)
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

impl QDNovel {
    pub(crate) async fn get_doc(id: &str) -> NovelResult<(String, String)> {
        let url = format!("https://m.qidian.com/book/{id}.html");
        let chapter_url = format!("https://m.qidian.com/book/{id}/catalog/");
        let data = tokio::try_join!(
            text_from_url(&url, "utf-8"),
            text_from_url(&chapter_url, "utf-8")
        )?;
        Ok(data)
    }
}

fn parse_chapters(html: &str, novel_id: &str) -> NovelResult<Vec<QDChapter>> {
    let html = Html::parse_document(html);
    let data = html
        .select(&SELECTOR_NOVEL_CHAPTERS)
        .next()
        .unwrap()
        .inner_html();
    #[derive(Serialize, Deserialize)]
    pub struct Data {
        #[serde(rename = "pageContext")]
        page_context: PageContext,
    }

    #[derive(Serialize, Deserialize)]
    struct PageContext {
        #[serde(rename = "pageProps")]
        page_props: PageProps,
    }

    #[derive(Serialize, Deserialize)]
    struct PageProps {
        #[serde(rename = "pageData")]
        page_data: PageData,
    }

    #[derive(Serialize, Deserialize)]
    struct PageData {
        #[serde(rename = "vs")]
        vs: Vec<V>,
    }

    #[derive(Serialize, Deserialize)]
    pub struct V {
        #[serde(rename = "cs")]
        cs: Vec<Chapter>,
    }

    #[derive(Serialize, Deserialize)]
    pub struct Chapter {
        #[serde(rename = "cN")]
        name: String,

        #[serde(rename = "id")]
        id: i64,
    }

    let data: Data = serde_json::from_str(&data)?;
    let data = data
        .page_context
        .page_props
        .page_data
        .vs
        .into_iter()
        .flat_map(|d| d.cs)
        .map(|Chapter { id, name }| QDChapter::new(novel_id.to_string(), id.to_string(), name))
        .collect();
    Ok(data)
}

#[cfg(test)]
mod test {
    use crate::novel::NovelFn;

    #[tokio::test]
    async fn qd_novel_test() -> anyhow::Result<()> {
        let novel_id = "1029006481";
        let novel = super::QDNovel::get_novel_data(novel_id).await?;
        println!("{novel:#?}");
        Ok(())
    }
}
