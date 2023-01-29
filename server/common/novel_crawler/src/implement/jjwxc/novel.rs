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
use scraper::{Html, Selector};

use crate::{
    errors::{NovelError, NovelResult},
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

#[derive(Debug)]
pub(crate) struct JJNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<JJChapter>,
}

#[async_trait::async_trait]
impl NovelFn for JJNovel {
    type Chapter = JJChapter;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let url = format!("https://www.jjwxc.net/onebook.php?novelid={novel_id}");
        let html = get_doc(&url, "gb18030").await?;
        let name = parse_inner_html(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let chapters = parse_chapters(&html, &SELECTOR_CHAPTER_URLS, novel_id)?;

        Ok(Self {
            id: novel_id.to_string(),
            name,
            description,
            image,
            chapters,
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
    use scraper::ElementRef;
    fn map_chapter(element: ElementRef) -> NovelResult<(String, String)> {
        let value = element.value();
        let url = value
            .attr("href")
            .or_else(|| value.attr("rel"))
            .ok_or(NovelError::ParseError)?
            .to_string();
        let id = parse_chapter_id(&url)?.1;
        let name = element.inner_html();
        Ok((id, name))
    }
    let element_ref = html
        .select(selector)
        .map(|x| match map_chapter(x) {
            Ok((chapter_id, name)) => Ok(JJChapter::new(novel_id.to_string(), chapter_id, name)),
            Err(e) => Err(e),
        })
        .collect::<NovelResult<Vec<_>>>()?;
    Ok(element_ref)
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

    #[tokio::test]
    async fn jj_novel_test() -> anyhow::Result<()> {
        let novel_id = "1485737";
        let novel = super::JJNovel::get_novel_data(novel_id).await?;
        println!("{novel:#?}");
        Ok(())
    }
}
