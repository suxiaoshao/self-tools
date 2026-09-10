use crate::{
    NovelError,
    errors::NovelResult,
    implement::{
        http::{UserAgent, text_from_url},
        parse_attr,
    },
    novel::{NovelFn, NovelStatus},
};
use nom::{
    IResult, Parser,
    bytes::{complete::tag, streaming::take_until},
    combinator::{all_consuming, eof},
};
use scraper::{ElementRef, Html, Selector};
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use time::{
    PrimitiveDateTime,
    macros::{format_description, offset},
};

use super::{chapter::QDChapter, tag::QDTag};

static SELECTOR_NOVEL_NAME: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("head > meta[property=\"og:novel:book_name\"]").unwrap());
static SELECTOR_NOVEL_DESCRIPTION: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("head > meta[property=\"og:description\"]").unwrap());
static SELECTOR_NOVEL_IMAGE: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("head > meta[property=\"og:image\"]").unwrap());
static SELECTOR_NOVEL_CHAPTERS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("#vite-plugin-ssr_pageContext").unwrap());
static SELECTOR_AUTHOR: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("meta[property=\"og:novel:author_link\"]").unwrap());
static SELECTOR_STATUS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("head > meta[property=\"og:novel:status\"]").unwrap());
static SELECTOR_TAGS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("div.tags-wrapper > ul.tags > li").unwrap());

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
    type Tag = QDTag;
    const SITE: crate::NovelSite = crate::NovelSite::Qidian;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let url = Self::get_url_from_id(novel_id);
        let chapter_url = format!("https://m.qidian.com/book/{novel_id}/catalog/");
        let (page, catalogue) = tokio::try_join!(
            text_from_url(&url, "utf-8", UserAgent::Mobile),
            text_from_url(&chapter_url, "utf-8", UserAgent::Mobile)
        )?;
        Self::parse(novel_id, &page, &catalogue)
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

    fn chapters(&self) -> &[Self::Chapter] {
        &self.chapters
    }
    fn get_url_from_id(id: &str) -> String {
        format!("https://m.qidian.com/book/{id}.html")
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
    fn parse(novel_id: &str, page: &str, catalogue: &str) -> NovelResult<Self> {
        let html = Html::parse_document(page);
        let name = parse_attr(&html, &SELECTOR_NOVEL_NAME, "content")?;
        let description = parse_attr(&html, &SELECTOR_NOVEL_DESCRIPTION, "content")?;
        let image = parse_attr(&html, &SELECTOR_NOVEL_IMAGE, "content")?;
        let image = format!("https:{image}");
        let chapters = parse_chapters(catalogue, novel_id)?;
        let status = parse_status(&html)?;
        let author_id = html
            .select(&SELECTOR_AUTHOR)
            .next()
            .ok_or(NovelError::ParseError)
            .and_then(parse_author)?;
        let tags = parse_tags(&html);
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
}

fn parse_chapters(html: &str, novel_id: &str) -> NovelResult<Vec<QDChapter>> {
    let html = Html::parse_document(html);
    let data = html
        .select(&SELECTOR_NOVEL_CHAPTERS)
        .next()
        .ok_or(NovelError::ParseError)?
        .inner_html();
    #[derive(Serialize, Deserialize)]
    struct Data {
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
    struct V {
        #[serde(rename = "cs")]
        cs: Vec<Chapter>,
    }

    #[derive(Serialize, Deserialize)]
    struct Chapter {
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
        let format_with_second =
            format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");
        let format_without_second = format_description!("[year]-[month]-[day] [hour]:[minute]");
        let time = PrimitiveDateTime::parse(&u_t, &format_with_second)
            .or_else(|_| PrimitiveDateTime::parse(&u_t, &format_without_second))?;
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
        .attr("content")
        .ok_or(NovelError::ParseError)?;

    let (_, id) = parse_author_id(href)?;
    Ok(id)
}

fn parse_author_id(input: &str) -> IResult<&str, String> {
    let (input, (_, data, _, _)) = all_consuming((
        tag("//m.qidian.com/author/"),
        take_until("/"),
        tag("/"),
        eof,
    ))
    .parse(input)?;
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
fn parse_tags(html: &Html) -> Vec<QDTag> {
    html.select(&SELECTOR_TAGS).filter_map(map_tag).collect()
}

fn map_tag(element_ref: ElementRef) -> Option<QDTag> {
    let text = element_ref.text().collect::<String>();
    match text.trim() {
        "" | "相似标签小说" => None,
        name => Some(QDTag {
            name: name.to_owned(),
        }),
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{ChapterFn, TagFn};
    use time::macros::datetime;

    const PAGE: &str = include_str!("../../../tests/fixtures/qidian-novel.html");
    const CATALOGUE: &str = include_str!("../../../tests/fixtures/qidian-catalogue.html");

    #[test]
    fn parses_metadata_and_borrows_catalogue_in_volume_order() {
        let novel = QDNovel::parse("901", PAGE, CATALOGUE).unwrap();
        assert_eq!(QDNovel::SITE, crate::NovelSite::Qidian);
        assert_eq!((novel.id(), novel.author_id()), ("901", "801"));
        assert_eq!(novel.name(), "起点样本小说");
        assert_eq!(novel.description(), "合成小说简介");
        assert_eq!(novel.image(), "https://example.invalid/qidian-novel.jpg");
        assert_eq!(novel.status(), NovelStatus::Ongoing);
        assert_eq!(
            novel
                .tags()
                .iter()
                .map(|tag| (tag.id(), tag.name()))
                .collect::<Vec<_>>(),
            [("奇幻", "奇幻"), ("冒险", "冒险")]
        );
        let chapters = novel.chapters();
        assert_eq!(
            chapters
                .iter()
                .map(|chapter| (chapter.chapter_id(), chapter.title(), chapter.word_count()))
                .collect::<Vec<_>>(),
            [
                ("903", "序章", 1200),
                ("901", "第一章", 2300),
                ("902", "第二章", 3400)
            ]
        );
        assert!(chapters.iter().all(|chapter| chapter.novel_id() == "901"));
        assert_eq!(chapters[0].time(), datetime!(2026-09-10 10:20:30 +8));
        assert_eq!(chapters[1].time(), datetime!(2026-09-10 11:21:00 +8));
        assert!(std::ptr::eq(chapters, novel.chapters.as_slice()));
        assert!(std::ptr::eq(chapters, novel.chapters()));
        for (text, status) in [
            ("完本", NovelStatus::Completed),
            ("暂停", NovelStatus::Paused),
        ] {
            assert_eq!(
                QDNovel::parse("901", &PAGE.replace("连载", text), CATALOGUE)
                    .unwrap()
                    .status(),
                status
            );
        }
    }

    #[test]
    fn distinguishes_empty_catalogue_from_invalid_documents() {
        let empty = r#"<script id="vite-plugin-ssr_pageContext">{"pageContext":{"pageProps":{"pageData":{"vs":[]}}}}</script>"#;
        assert!(
            QDNovel::parse("901", PAGE, empty)
                .unwrap()
                .chapters()
                .is_empty()
        );
        assert!(matches!(
            QDNovel::parse("901", PAGE, "<html></html>"),
            Err(NovelError::ParseError)
        ));
        let malformed = r#"<script id="vite-plugin-ssr_pageContext">{</script>"#;
        assert!(matches!(
            QDNovel::parse("901", PAGE, malformed),
            Err(NovelError::Json(_))
        ));
        let missing_name = PAGE.replace("og:novel:book_name", "other");
        assert!(matches!(
            QDNovel::parse("901", &missing_name, CATALOGUE),
            Err(NovelError::ParseError)
        ));
        let bad_time = CATALOGUE.replace("2026-09-10 10:20:30", "invalid-time");
        assert!(matches!(
            QDNovel::parse("901", PAGE, &bad_time),
            Err(NovelError::TimeParseError(_))
        ));
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
