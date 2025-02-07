use std::sync::LazyLock;

use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use time::{
    macros::{format_description, offset},
    PrimitiveDateTime,
};

use crate::{
    errors::NovelResult,
    implement::{parse_image_src, parse_text, text_from_url},
    novel::{NovelFn, NovelStatus},
    NovelError, QDAuthor,
};

use nom::{
    bytes::{complete::tag, streaming::take_until},
    combinator::{all_consuming, eof},
    sequence::tuple,
    IResult,
};

use super::{chapter::QDChapter, tag::QDTag};

static SELECTOR_NOVEL_NAME: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("h1.header-back-title").unwrap());
static SELECTOR_NOVEL_DESCRIPTION: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("content.detail__summary__content").unwrap());
static SELECTOR_NOVEL_IMAGE: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("img.detail__header-bg").unwrap());
static SELECTOR_NOVEL_CHAPTERS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("#vite-plugin-ssr_pageContext").unwrap());
static SELECTOR_AUTHOR: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("a.detail__header-detail__author-link").unwrap());
static SELECTOR_STATUS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("head > meta[property=\"og:novel:status\"]").unwrap());
static SELECTOR_TAGS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("div.search-tags > a").unwrap());

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<QDChapter>,
    author_id: String,
    status: NovelStatus,
    tags: Vec<QDTag>,
}

impl NovelFn for QDNovel {
    type Chapter = QDChapter;
    type Author = QDAuthor;
    type Tag = QDTag;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let (html, chapter_html) = Self::get_doc(novel_id).await?;
        let html = Html::parse_document(&html);
        let name = parse_text(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let image = format!("https:{image}");
        let chapters: Vec<QDChapter> = parse_chapters(&chapter_html, novel_id)?;
        let status = parse_status(&html)?;
        let author_id = html
            .select(&SELECTOR_AUTHOR)
            .next()
            .ok_or(NovelError::ParseError)
            .and_then(parse_author)?;
        let tags = parse_tags(&html)?;
        Ok(Self {
            id: novel_id.to_string(),
            name,
            description,
            image,
            chapters,
            author_id,
            status,
            tags,
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
    fn status(&self) -> NovelStatus {
        self.status
    }
    fn id(&self) -> &str {
        self.id.as_str()
    }

    fn tags(&self) -> &[Self::Tag] {
        self.tags.as_slice()
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
    fn map_chapter(
        Chapter { name, id, cnt, u_t }: Chapter,
        novel_id: &str,
    ) -> NovelResult<QDChapter> {
        let format = format_description!("[year]-[month]-[day] [hour]:[minute]");
        let time = PrimitiveDateTime::parse(&u_t, &format)?;
        let time = time.assume_offset(offset!(+8));
        Ok(QDChapter::new(
            novel_id.to_string(),
            id.to_string(),
            name,
            cnt,
            time,
        ))
    }
    let data = data
        .page_context
        .page_props
        .page_data
        .vs
        .into_iter()
        .flat_map(|d| d.cs)
        .map(|chapter| map_chapter(chapter, novel_id))
        .collect::<NovelResult<_>>()?;
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
fn parse_status(html: &Html) -> NovelResult<NovelStatus> {
    let status = html
        .select(&SELECTOR_STATUS)
        .next()
        .ok_or(NovelError::ParseError)?
        .value()
        .attr("content")
        .ok_or(NovelError::ParseError)?;
    match status {
        "连载" => Ok(NovelStatus::Ongoing),
        "完本" => Ok(NovelStatus::Completed),
        "暂停" => Ok(NovelStatus::Paused),
        _ => Err(NovelError::ParseError),
    }
}
fn parse_tags(html: &Html) -> NovelResult<Vec<QDTag>> {
    let tags = html.select(&SELECTOR_TAGS).map(map_tag).collect();
    tags
}

fn map_tag(element_ref: ElementRef) -> NovelResult<QDTag> {
    let name = element_ref.inner_html();
    Ok(QDTag { name })
}

#[cfg(test)]
mod test {
    use crate::novel::NovelFn;

    #[tokio::test]
    async fn qd_novel_test() -> anyhow::Result<()> {
        let novel_id = "1040796068";
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
