use std::{collections::HashSet, sync::LazyLock};

use futures::future::try_join_all;
use nom::{
    bytes::complete::{tag, take_until},
    combinator::{all_consuming, eof},
    IResult, Parser,
};
use scraper::{ElementRef, Html, Selector};

use crate::{
    author::AuthorFn,
    errors::{NovelError, NovelResult},
    implement::{parse_attr, parse_inner_html, parse_text, text_from_url},
    novel::NovelFn,
};

use super::novel::QDNovel;

static SELECTOR_AUTHOR_NAME: LazyLock<Selector> = LazyLock::new(|| {
    Selector::parse("#appContentWrap > div > div > div > div[class^=authorName] > h1").unwrap()
});
static SELECTOR_AUTHOR_DESCRIPTION: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("p[class^=\"authorDesc\"]").unwrap());
static SELECTOR_AUTHOR_IMAGE: LazyLock<Selector> =
    LazyLock::new(|| Selector::parse("#appContentWrap > div > div > div > div > img").unwrap());
static SELECTOR_NOVEL_URLS: LazyLock<Selector> = LazyLock::new(|| {
    Selector::parse("#appContentWrap > div > div > div > div[class^=allBookListItem] > a").unwrap()
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
    type Novel = QDNovel;
    const SITE: crate::NovelSite = crate::NovelSite::Qidian;
    async fn get_author_data(author_id: &str) -> NovelResult<Self> {
        let url = format!("https://m.qidian.com/author/{author_id}/");
        let image_doc = text_from_url(&url, "utf-8").await?;
        let image_doc = Html::parse_document(&image_doc);

        // 图片
        let image = parse_attr(&image_doc, &SELECTOR_AUTHOR_IMAGE, "data-src")?;
        // 其他
        let name = parse_inner_html(&image_doc, &SELECTOR_AUTHOR_NAME)?;
        let description = parse_text(&image_doc, &SELECTOR_AUTHOR_DESCRIPTION)?;
        let urls = image_doc
            .select(&SELECTOR_NOVEL_URLS)
            .map(map_url)
            .collect::<NovelResult<_>>()?;
        Ok(Self {
            id: author_id.to_string(),
            name,
            description,
            image,
            novel_ids: urls,
        })
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
    async fn novels(&self) -> NovelResult<Vec<Self::Novel>> {
        let data = try_join_all(self.novel_ids.iter().map(|x| QDNovel::get_novel_data(x))).await?;
        Ok(data)
    }
    fn get_url_from_id(id: &str) -> String {
        format!("https://m.qidian.com/author/{id}/")
    }
    fn id(&self) -> &str {
        self.id.as_str()
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

    #[tokio::test]
    async fn qd_author_test() -> anyhow::Result<()> {
        let author = QDAuthor::get_author_data("4362948").await?;
        println!("{author:#?}");
        Ok(())
    }
}
