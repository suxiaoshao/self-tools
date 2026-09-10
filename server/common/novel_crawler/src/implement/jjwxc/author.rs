use std::{collections::HashSet, sync::LazyLock};

use nom::{
    IResult, Parser,
    bytes::complete::{tag, take_while},
    combinator::{all_consuming, eof},
};

use scraper::{ElementRef, Html, Selector};

use crate::{
    author::AuthorFn,
    errors::{NovelError, NovelResult},
    implement::{
        http::{UserAgent, text_from_url},
        parse_image_src, parse_inner_html, parse_text,
    },
};

static SELECTOR_AUTHOR_NAME: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("[itemprop=name]").unwrap());
static SELECTOR_AUTHOR_DESCRIPTION: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("[itemprop=description]").unwrap());
static SELECTOR_AUTHOR_IMAGE: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse(".authordefaultimage").unwrap());
static SELECTOR_NOVEL_URLS: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("a[href^=\"onebook.php?novelid=\"]:not(.tooltip)").unwrap());

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JJAuthor {
    id: String,
    name: String,
    description: String,
    image: String,
    novel_ids: HashSet<String>,
}

impl AuthorFn for JJAuthor {
    const SITE: crate::NovelSite = crate::NovelSite::Jjwxc;
    async fn get_author_data(author_id: &str) -> NovelResult<Self> {
        let url = format!("https://www.jjwxc.net/oneauthor.php?authorid={author_id}");
        let page = text_from_url(&url, "gb18030", UserAgent::Mobile).await?;
        Self::parse(author_id, &page)
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
    fn get_url_from_id(id: &str) -> String {
        format!("https://www.jjwxc.net/oneauthor.php?authorid={id}")
    }
    fn novel_ids(&self) -> &HashSet<String> {
        &self.novel_ids
    }
    fn id(&self) -> &str {
        self.id.as_str()
    }
}

impl JJAuthor {
    fn parse(author_id: &str, page: &str) -> NovelResult<Self> {
        let html = Html::parse_document(page);
        Ok(Self {
            id: author_id.to_string(),
            image: parse_image_src(&html, &SELECTOR_AUTHOR_IMAGE)?,
            name: parse_inner_html(&html, &SELECTOR_AUTHOR_NAME)?,
            description: parse_text(&html, &SELECTOR_AUTHOR_DESCRIPTION)?,
            novel_ids: html
                .select(&SELECTOR_NOVEL_URLS)
                .map(map_url)
                .collect::<NovelResult<_>>()?,
        })
    }
}

fn map_url(element_ref: ElementRef) -> NovelResult<String> {
    let href = element_ref
        .value()
        .attr("href")
        .ok_or(NovelError::ParseError)?;

    let (_, id) = novel_id(href)?;
    Ok(id)
}

fn novel_id(input: &str) -> IResult<&str, String> {
    let (input, (_, data, _)) =
        all_consuming((tag("onebook.php?novelid="), take_while(|_| true), eof)).parse(input)?;
    Ok((input, data.to_string()))
}

#[cfg(test)]
mod test {

    use super::*;

    #[test]
    fn novel_id_test() -> anyhow::Result<()> {
        let input = "onebook.php?novelid=1789677";
        let (input, id) = novel_id(input)?;
        assert_eq!(id, "1789677");
        assert_eq!(input, "");
        Ok(())
    }

    const PAGE: &str = include_str!("../../../tests/fixtures/jjwxc-author.html");

    #[test]
    fn parses_author_and_filters_duplicate_and_tooltip_links() {
        let author = JJAuthor::parse("601", PAGE).unwrap();
        assert_eq!(author.id(), "601");
        assert_eq!(author.name(), "晋江样本作者");
        assert_eq!(author.description(), "合成作者简介");
        assert_eq!(author.image(), "https://example.invalid/jjwxc-author.jpg");
        assert_eq!(
            author.novel_ids(),
            &HashSet::from(["701".into(), "702".into()])
        );
    }

    #[test]
    fn distinguishes_no_works_from_missing_author_metadata() {
        let no_works = PAGE.replace("onebook.php?novelid=", "other.php?novelid=");
        assert!(
            JJAuthor::parse("601", &no_works)
                .unwrap()
                .novel_ids()
                .is_empty()
        );
        let missing_name = PAGE.replace("itemprop=\"name\"", "itemprop=\"other\"");
        assert!(matches!(
            JJAuthor::parse("601", &missing_name),
            Err(NovelError::ParseError)
        ));
    }
}
