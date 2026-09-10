use crate::{
    author::AuthorFn,
    errors::{NovelError, NovelResult},
    implement::{
        http::{UserAgent, text_from_url},
        parse_attr, parse_inner_html, parse_text,
    },
};
use nom::{
    IResult, Parser,
    bytes::complete::{tag, take_until},
    combinator::{all_consuming, eof},
};
use scraper::{ElementRef, Html, Selector};
use std::{collections::HashSet, sync::LazyLock};

static SELECTOR_AUTHOR_NAME: LazyLock<Selector> = LazyLock::new(|| {
    Selector::parse("#appContentWrap > div > div > div > div[class*=authorName] > h2").unwrap()
});
static SELECTOR_AUTHOR_DESCRIPTION: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("p[class*=\"authorDesc\"]").unwrap());
static SELECTOR_AUTHOR_IMAGE: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("#appContentWrap > div > div > div > div > img").unwrap());
static SELECTOR_NOVEL_URLS: LazyLock<Selector> = LazyLock::new(|| {
    Selector::parse("#appContentWrap > div > div > div > div[class*=allBookListItem] > a").unwrap()
});

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QDAuthor {
    id: String,
    name: String,
    description: String,
    image: String,
    novel_ids: HashSet<String>,
}

impl AuthorFn for QDAuthor {
    const SITE: crate::NovelSite = crate::NovelSite::Qidian;
    async fn get_author_data(author_id: &str) -> NovelResult<Self> {
        let url = format!("https://m.qidian.com/author/{author_id}/");
        let page = text_from_url(&url, "utf-8", UserAgent::Mobile).await?;
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
        format!("https://m.qidian.com/author/{id}/")
    }
    fn novel_ids(&self) -> &HashSet<String> {
        &self.novel_ids
    }
    fn id(&self) -> &str {
        self.id.as_str()
    }
}

impl QDAuthor {
    fn parse(author_id: &str, page: &str) -> NovelResult<Self> {
        let html = Html::parse_document(page);
        Ok(Self {
            id: author_id.to_string(),
            image: parse_attr(&html, &SELECTOR_AUTHOR_IMAGE, "data-src")?,
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
    let (input, (_, data, _, _)) =
        all_consuming((tag("//m.qidian.com/book/"), take_until("/"), tag("/"), eof))
            .parse(input)?;
    Ok((input, data.to_string()))
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn novel_id_test() -> anyhow::Result<()> {
        let input = "//m.qidian.com/book/1026909178/";
        let (input, id) = novel_id(input)?;
        assert_eq!(id, "1026909178");
        assert_eq!(input, "");
        Ok(())
    }

    const PAGE: &str = include_str!("../../../tests/fixtures/qidian-author.html");

    #[test]
    fn parses_author_and_deduplicates_novel_ids() {
        let author = QDAuthor::parse("801", PAGE).unwrap();
        assert_eq!(author.id(), "801");
        assert_eq!(author.name(), "起点样本作者");
        assert_eq!(author.description(), "合成作者简介");
        assert_eq!(author.image(), "https://example.invalid/qidian-author.jpg");
        assert_eq!(
            author.novel_ids(),
            &HashSet::from(["901".into(), "902".into()])
        );
    }

    #[test]
    fn distinguishes_no_works_from_missing_author_metadata() {
        let no_works = PAGE.replace("allBookListItem", "otherItem");
        assert!(
            QDAuthor::parse("801", &no_works)
                .unwrap()
                .novel_ids()
                .is_empty()
        );
        let missing_name = PAGE.replace("authorName", "otherName");
        assert!(matches!(
            QDAuthor::parse("801", &missing_name),
            Err(NovelError::ParseError)
        ));
        let bad_link = PAGE.replace("//m.qidian.com/book/901/", "/unexpected/901/");
        assert!(matches!(
            QDAuthor::parse("801", &bad_link),
            Err(NovelError::Nom(_))
        ));
    }
}
