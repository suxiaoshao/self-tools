use futures::future::try_join_all;
use nom::{
    bytes::complete::{tag, take_until},
    combinator::{all_consuming, eof},
    sequence::tuple,
    IResult,
};
use once_cell::sync::Lazy;
use scraper::{ElementRef, Html, Selector};

use crate::{
    author::AuthorFn,
    errors::{NovelError, NovelResult},
    implement::{parse_attr, parse_inner_html, parse_text, text_from_url},
    novel::NovelFn,
};

use super::novel::QDNovel;

static SELECTOR_AUTHOR_NAME: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("#appContentWrap > div > div > div > div[class^=authorName] > h1").unwrap()
});
static SELECTOR_AUTHOR_DESCRIPTION: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#appContentWrap > div > div > div > p").unwrap());
static SELECTOR_AUTHOR_IMAGE: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#appContentWrap > div > div > div > div > img").unwrap());
static SELECTOR_NOVEL_URLS: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("#appContentWrap > div > div > div > div[class^=allBookListItem] > a").unwrap()
});

#[derive(Debug)]
struct QDAuthor {
    id: String,
    name: String,
    description: String,
    image: String,
    novel_ids: Vec<String>,
}

impl AuthorFn for QDAuthor {
    type Novel = QDNovel;
    async fn get_author_data(author_id: &str) -> NovelResult<Self> {
        let url = format!("https://m.qidian.com/author/{author_id}/");
        let image_doc = text_from_url(&url, "utf-8").await?;
        let image_doc = Html::parse_document(&image_doc);

        // 图片
        let image = parse_attr(&image_doc, &SELECTOR_AUTHOR_IMAGE, "data-src")?;
        let image = format!("https:{image}");
        // 其他
        let name = parse_inner_html(&image_doc, &SELECTOR_AUTHOR_NAME)?;
        let description = parse_text(&image_doc, &SELECTOR_AUTHOR_DESCRIPTION)?;
        let urls = image_doc
            .select(&SELECTOR_NOVEL_URLS)
            .map(map_url)
            .collect::<NovelResult<Vec<_>>>()?;
        Ok(Self {
            id: author_id.to_string(),
            name,
            description,
            image,
            novel_ids: urls,
        })
    }

    fn url(&self) -> String {
        let data = format!("https://m.qidian.com/author/{}/", self.id);
        data
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
    let (input, (_, data, _, _)) = all_consuming(tuple((
        tag("//m.qidian.com/book/"),
        take_until("/"),
        tag("/"),
        eof,
    )))(input)?;
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
        let author = QDAuthor::get_author_data("4362386").await?;
        println!("{author:#?}");
        Ok(())
    }
}
