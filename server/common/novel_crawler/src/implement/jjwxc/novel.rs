use std::sync::LazyLock;

use nom::{
    IResult, Parser,
    bytes::{
        complete::{is_not, tag, take_while},
        streaming::take_until,
    },
    combinator::{all_consuming, eof},
};
use scraper::{ElementRef, Html, Selector};
use time::{
    OffsetDateTime, PrimitiveDateTime,
    macros::{format_description, offset},
};

use crate::{
    errors::{NovelError, NovelResult},
    implement::{
        http::{UserAgent, text_from_url},
        parse_image_src, parse_inner_html, parse_text,
    },
    novel::{NovelFn, NovelStatus},
};

use super::{chapter::JJChapter, tag::JJTag};

static SELECTOR_NOVEL_NAME: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("[itemprop=name] > span").unwrap());
static SELECTOR_NOVEL_DESCRIPTION: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("#novelintro").unwrap());
static SELECTOR_NOVEL_IMAGE: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("img.noveldefaultimage").unwrap());

static SELECTOR_CHAPTER: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("#oneboolt > tbody > tr[itemprop=\"chapter\"]").unwrap());
static SELECTOR_CHAPTER_NAME: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("a[itemprop='url']").unwrap());
static SELECTOR_CHAPTER_TIME: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("td[title] > span").unwrap());
static SELECTOR_CHAPTER_WORD_COUNT: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("td[itemprop='wordCount']").unwrap());

static SELECTOR_AUTHOR: LazyLock<Selector> = LazyLock::new(|| {
    Selector::parse("#oneboolt > tbody > tr > td > div:nth-child(3) > h2 > a").unwrap()
});

static SELECTOR_STATUS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("span[itemprop='updataStatus']").unwrap());
static SELECTOR_TAGS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("div.smallreadbody > span > a").unwrap());
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JJNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<JJChapter>,
    author_id: String,
    status: NovelStatus,
    tags: Vec<JJTag>,
}

impl NovelFn for JJNovel {
    type Chapter = JJChapter;
    type Tag = JJTag;
    const SITE: crate::NovelSite = crate::NovelSite::Jjwxc;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let url = Self::get_url_from_id(novel_id);
        let page = text_from_url(&url, "gb18030", UserAgent::Default).await?;
        Self::parse(novel_id, &page)
    }

    fn url(&self) -> String {
        Self::get_url_from_id(&self.id)
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

    fn chapters(&self) -> &[Self::Chapter] {
        &self.chapters
    }

    fn author_id(&self) -> &str {
        self.author_id.as_str()
    }
    fn get_url_from_id(id: &str) -> String {
        format!("https://www.jjwxc.net/onebook.php?novelid={id}")
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

impl JJNovel {
    fn parse(novel_id: &str, page: &str) -> NovelResult<Self> {
        let html = Html::parse_document(page);
        let name = parse_inner_html(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let chapters = parse_chapters(&html, &SELECTOR_CHAPTER, novel_id)?;
        let author_id = html
            .select(&SELECTOR_AUTHOR)
            .next()
            .ok_or(NovelError::ParseError)
            .and_then(parse_author)?;
        let status = parse_status(&html)?;
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
}

fn parse_chapter_id(url: &str) -> IResult<&str, String> {
    let (input, (_, _, data, _)) = all_consuming((
        take_until("chapterid="),
        tag("chapterid="),
        take_while(|_| true),
        eof,
    ))
    .parse(url)?;
    Ok((input, data.to_string()))
}

fn parse_chapters(html: &Html, selector: &Selector, novel_id: &str) -> NovelResult<Vec<JJChapter>> {
    let table = Selector::parse("#oneboolt").expect("static selector");
    if html.select(&table).next().is_none() {
        return Err(NovelError::ParseError);
    }
    fn parse_time(time: &str) -> NovelResult<OffsetDateTime> {
        let format = format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");
        let time = PrimitiveDateTime::parse(time, &format)?;
        Ok(time.assume_offset(offset!(+8)))
    }
    fn map_chapter(
        element: ElementRef,
        name: ElementRef,
    ) -> NovelResult<(String, String, u32, OffsetDateTime)> {
        let url = name
            .value()
            .attr("href")
            .or_else(|| name.attr("rel"))
            .ok_or(NovelError::ParseError)?
            .to_string();
        let name = name.inner_html();
        let id = parse_chapter_id(&url)?.1;
        let time = element
            .select(&SELECTOR_CHAPTER_TIME)
            .next()
            .ok_or(NovelError::ParseError)?
            .inner_html();
        let time = time.trim();
        let time = parse_time(time)?;
        let word_count = element
            .select(&SELECTOR_CHAPTER_WORD_COUNT)
            .next()
            .ok_or(NovelError::ParseError)?
            .inner_html();
        Ok((id, name, word_count.trim().parse()?, time))
    }
    fn filter_map_chapter(
        element_ref: ElementRef,
    ) -> Option<NovelResult<(String, String, u32, OffsetDateTime)>> {
        let name = element_ref.select(&SELECTOR_CHAPTER_NAME).next()?;
        Some(map_chapter(element_ref, name))
    }

    let element_ref = html
        .select(selector)
        .filter_map(|data| {
            filter_map_chapter(data).map(|data| match data {
                Ok((chapter_id, title, word_count, time)) => Ok(JJChapter::new(
                    novel_id.to_string(),
                    chapter_id,
                    title,
                    word_count,
                    time,
                )),
                Err(err) => Err(err),
            })
        })
        .collect::<NovelResult<Vec<_>>>()?;
    Ok(element_ref)
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
    let (input, (_, data, _)) = all_consuming((
        tag("http://www.jjwxc.net/oneauthor.php?authorid="),
        take_while(|_| true),
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
        .text()
        .fold(String::new(), |mut acc, f| {
            acc.push_str(f);
            acc
        });
    match status.as_str() {
        "连载" => Ok(NovelStatus::Ongoing),
        "完结" => Ok(NovelStatus::Completed),
        _ => Err(NovelError::ParseError),
    }
}

fn parse_tags(html: &Html) -> NovelResult<Vec<JJTag>> {
    html.select(&SELECTOR_TAGS).map(map_tag).collect()
}

fn map_tag(element_ref: ElementRef) -> NovelResult<JJTag> {
    let href = element_ref
        .value()
        .attr("href")
        .ok_or(NovelError::ParseError)?;

    let (_, id) = tag_id(href)?;
    let name = element_ref.inner_html();
    Ok(JJTag { id, name })
}

fn tag_id(input: &str) -> IResult<&str, String> {
    let (input, (_, data, _)) =
        all_consuming((tag("//www.jjwxc.net/bookbase.php?bq="), is_not("&"), eof)).parse(input)?;
    Ok((input, data.to_string()))
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::{ChapterFn, TagFn};
    use time::macros::datetime;

    const PAGE: &str = include_str!("../../../tests/fixtures/jjwxc-novel.html");

    #[test]
    fn parse_chapter_id_test() -> anyhow::Result<()> {
        let input = "http://www.jjwxc.net/onebook.php?novelid=4375938&chapterid=1";
        let (_, data) = super::parse_chapter_id(input)?;
        assert_eq!(data, "1");
        let input = "http://my.jjwxc.net/onebook_vip.php?novelid=4375938&chapterid=25";
        let (_, data) = super::parse_chapter_id(input)?;
        assert_eq!(data, "25");
        Ok(())
    }

    #[test]
    fn parse_author_id_test() -> anyhow::Result<()> {
        let input = "http://www.jjwxc.net/oneauthor.php?authorid=148573";
        let (_, data) = super::parse_author_id(input)?;
        assert_eq!(data, "148573");
        let input = "http://www.jjwxc.net/oneauthor.php?authorid=809836";
        let (_, data) = super::parse_author_id(input)?;
        assert_eq!(data, "809836");
        Ok(())
    }

    #[test]
    fn parses_metadata_and_borrows_href_and_rel_chapters_in_source_order() {
        let novel = JJNovel::parse("701", PAGE).unwrap();
        assert_eq!(JJNovel::SITE, crate::NovelSite::Jjwxc);
        assert_eq!((novel.id(), novel.author_id()), ("701", "601"));
        assert_eq!(novel.name(), "晋江样本小说");
        assert_eq!(novel.description(), "合成小说简介");
        assert_eq!(novel.image(), "https://example.invalid/jjwxc-novel.jpg");
        assert_eq!(novel.status(), NovelStatus::Completed);
        assert_eq!(
            novel
                .tags()
                .iter()
                .map(|tag| (tag.id(), tag.name()))
                .collect::<Vec<_>>(),
            [("1", "奇幻")]
        );
        let chapters = novel.chapters();
        assert_eq!(
            chapters
                .iter()
                .map(|chapter| (chapter.chapter_id(), chapter.title(), chapter.word_count()))
                .collect::<Vec<_>>(),
            [("3", "序章", 1200), ("1", "第一章", 2300)]
        );
        assert!(chapters.iter().all(|chapter| chapter.novel_id() == "701"));
        assert_eq!(chapters[0].time(), datetime!(2026-09-10 10:20:30 +8));
        assert_eq!(chapters[1].time(), datetime!(2026-09-10 11:21:31 +8));
        assert!(std::ptr::eq(chapters, novel.chapters.as_slice()));
        assert!(std::ptr::eq(chapters, novel.chapters()));
        assert_eq!(
            JJNovel::parse("701", &PAGE.replace("完结", "连载"))
                .unwrap()
                .status(),
            NovelStatus::Ongoing
        );
    }

    #[test]
    fn distinguishes_empty_catalogue_from_missing_structure_and_invalid_chapters() {
        let empty = PAGE.replace("itemprop=\"chapter\"", "data-omitted=\"chapter\"");
        assert!(JJNovel::parse("701", &empty).unwrap().chapters().is_empty());
        let missing_catalogue = PAGE.replace("id=\"oneboolt\"", "id=\"other\"");
        assert!(matches!(
            JJNovel::parse("701", &missing_catalogue),
            Err(NovelError::ParseError)
        ));
        let bad_count = PAGE.replace("1200", "invalid-count");
        assert!(matches!(
            JJNovel::parse("701", &bad_count),
            Err(NovelError::Number(_))
        ));
        let bad_time = PAGE.replace("2026-09-10 10:20:30", "invalid-time");
        assert!(matches!(
            JJNovel::parse("701", &bad_time),
            Err(NovelError::TimeParseError(_))
        ));
    }
    #[test]
    fn tag_id_test() -> anyhow::Result<()> {
        let input = "//www.jjwxc.net/bookbase.php?bq=1";
        let (_, data) = super::tag_id(input)?;
        assert_eq!(data, "1");
        let input = "//www.jjwxc.net/bookbase.php?bq=2";
        let (_, data) = super::tag_id(input)?;
        assert_eq!(data, "2");
        Ok(())
    }
}
