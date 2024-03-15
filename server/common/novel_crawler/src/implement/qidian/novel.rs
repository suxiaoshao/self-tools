use once_cell::sync::Lazy;
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};

use crate::{
    errors::NovelResult,
    implement::{parse_image_src, parse_text, text_from_url},
    novel::NovelFn,
    NovelError, QDAuthor,
};

use nom::{
    bytes::{complete::tag, streaming::take_until},
    combinator::{all_consuming, eof},
    sequence::tuple,
    IResult,
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
static SELECTOR_AUTHOR: Lazy<Selector> =
    Lazy::new(|| Selector::parse("a.detail__header-detail__author-link").unwrap());

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<QDChapter>,
    author_id: String,
}

impl NovelFn for QDNovel {
    type Chapter = QDChapter;
    type Author = QDAuthor;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let (html, chapter_html) = Self::get_doc(novel_id).await?;
        let html = Html::parse_document(&html);
        let name = parse_text(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let image = format!("https:{image}");
        let chapters: Vec<QDChapter> = parse_chapters(&chapter_html, novel_id)?;
        let author_id = html
            .select(&SELECTOR_AUTHOR)
            .next()
            .ok_or(NovelError::ParseError)
            .and_then(parse_author)?;
        Ok(Self {
            id: novel_id.to_string(),
            name,
            description,
            image,
            chapters,
            author_id,
        })
    }

    fn url(&self) -> String {
        Self::get_url_from_id(self.id.as_str())
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
    fn author_id(&self) -> &str {
        self.author_id.as_str()
    }

    async fn chapters(&self) -> NovelResult<Vec<Self::Chapter>> {
        Ok(self.chapters.clone())
    }
    fn get_url_from_id(id: &str) -> String {
        format!("https://m.qidian.com/book/{}.html", id)
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
        .ok_or(NovelError::ParseError)?
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
        #[serde(rename = "cnt")]
        cnt: u32,
        #[serde(rename = "uT")]
        u_t: String,
    }

    let data: Data = serde_json::from_str(&data)?;
    let data = data
        .page_context
        .page_props
        .page_data
        .vs
        .into_iter()
        .flat_map(|d| d.cs)
        .map(|Chapter { id, name, cnt, u_t }| {
            QDChapter::new(novel_id.to_string(), id.to_string(), name, cnt, u_t)
        })
        .collect();
    Ok(data)
}

fn parse_author(element_ref: ElementRef) -> NovelResult<String> {
    let href = element_ref
        .value()
        .attr("href")
        .ok_or(NovelError::ParseError)?;

    let (_, id) = parse_author_id(href)?;
    Ok(id)
}

fn parse_author_id(input: &str) -> IResult<&str, String> {
    let (input, (_, data, _, _)) = all_consuming(tuple((
        tag("//m.qidian.com/author/"),
        take_until("/"),
        tag("/"),
        eof,
    )))(input)?;
    Ok((input, data.to_string()))
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

    #[test]
    fn parse_author_id_test() -> anyhow::Result<()> {
        let input = "//m.qidian.com/author/101010/";
        let (_, data) = super::parse_author_id(input)?;
        assert_eq!(data, "101010");
        let input = "//m.qidian.com/author/102020/";
        let (_, data) = super::parse_author_id(input)?;
        assert_eq!(data, "102020");
        Ok(())
    }
}
