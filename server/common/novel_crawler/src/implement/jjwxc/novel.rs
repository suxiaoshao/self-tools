use nom::{
    bytes::{
        complete::{tag, take_while},
        streaming::take_until,
    },
    combinator::{all_consuming, eof},
    sequence::tuple,
    IResult,
};
use once_cell::sync::Lazy;
use scraper::{ElementRef, Html, Selector};

use crate::{
    errors::{NovelError, NovelResult},
    implement::{get_doc, parse_image_src, parse_inner_html, parse_text},
    novel::NovelFn,
    JJAuthor,
};

use super::chapter::JJChapter;

static SELECTOR_NOVEL_NAME: Lazy<Selector> =
    Lazy::new(|| Selector::parse("[itemprop=name] > span").unwrap());
static SELECTOR_NOVEL_DESCRIPTION: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#novelintro").unwrap());
static SELECTOR_NOVEL_IMAGE: Lazy<Selector> =
    Lazy::new(|| Selector::parse("img.noveldefaultimage").unwrap());

static SELECTOR_CHAPTER: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#oneboolt > tbody > tr[itemprop=\"chapter\"]").unwrap());
static SELECTOR_CHAPTER_NAME: Lazy<Selector> =
    Lazy::new(|| Selector::parse("a[itemprop='url']").unwrap());
static SELECTOR_CHAPTER_TIME: Lazy<Selector> =
    Lazy::new(|| Selector::parse("td[title] > span").unwrap());
static SELECTOR_CHAPTER_WORD_COUNT: Lazy<Selector> =
    Lazy::new(|| Selector::parse("td[itemprop='wordCount']").unwrap());

static SELECTOR_AUTHOR: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("#oneboolt > tbody > tr > td > div:nth-child(3) > h2 > a").unwrap()
});

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JJNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<JJChapter>,
    author_id: String,
}

impl NovelFn for JJNovel {
    type Chapter = JJChapter;
    type Author = JJAuthor;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let url = format!("https://www.jjwxc.net/onebook.php?novelid={novel_id}");
        let html = get_doc(&url, "gb18030").await?;
        let name = parse_inner_html(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let chapters = parse_chapters(&html, &SELECTOR_CHAPTER, novel_id)?;
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
        format!("https://www.jjwxc.net/onebook.php?novelid={}", self.id)
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
}

fn parse_chapter_id(url: &str) -> IResult<&str, String> {
    let (input, (_, _, data, _)) = all_consuming(tuple((
        take_until("chapterid="),
        tag("chapterid="),
        take_while(|_| true),
        eof,
    )))(url)?;
    Ok((input, data.to_string()))
}

fn parse_chapters(html: &Html, selector: &Selector, novel_id: &str) -> NovelResult<Vec<JJChapter>> {
    fn map_chapter(element: ElementRef) -> NovelResult<(String, String, u32, String)> {
        let name = element
            .select(&SELECTOR_CHAPTER_NAME)
            .next()
            .ok_or(NovelError::ParseError)?;
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
            .inner_html()
            .trim()
            .to_string();
        let word_count = element
            .select(&SELECTOR_CHAPTER_WORD_COUNT)
            .next()
            .ok_or(NovelError::ParseError)?
            .inner_html();
        Ok((id, name, word_count.parse().unwrap_or(0), time))
    }
    let element_ref = html
        .select(selector)
        .map(|data| match map_chapter(data) {
            Ok((chapter_id, title, word_count, time)) => Ok(JJChapter::new(
                novel_id.to_string(),
                chapter_id,
                title,
                word_count,
                time,
            )),
            Err(err) => Err(err),
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
    let (input, (_, data, _)) = all_consuming(tuple((
        tag("http://www.jjwxc.net/oneauthor.php?authorid="),
        take_while(|_| true),
        eof,
    )))(input)?;
    Ok((input, data.to_string()))
}

#[cfg(test)]
mod test {
    use crate::novel::NovelFn;

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

    #[tokio::test]
    async fn jj_novel_test() -> anyhow::Result<()> {
        let novel_id = "1485737";
        let novel = super::JJNovel::get_novel_data(novel_id).await?;
        println!("{novel:#?}");
        let novel_id = "6357210";
        let novel = super::JJNovel::get_novel_data(novel_id).await?;
        println!("{novel:#?}");
        Ok(())
    }
}
