use futures::future::try_join_all;
use nom::{
    bytes::complete::{tag, take_while},
    combinator::{all_consuming, eof},
    sequence::tuple,
    IResult,
};

use once_cell::sync::Lazy;
use scraper::{ElementRef, Html, Selector};

use crate::{
    author::AuthorFn,
    errors::{NovelError, NovelResult},
    implement::{parse_image_src, parse_inner_html, parse_text, text_from_url},
    novel::NovelFn,
};

use super::novel::JJNovel;

static SELECTOR_AUTHOR_NAME: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("body > table:nth-child(23) > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr > td:nth-child(1) > font > b > span").unwrap()
});
static SELECTOR_AUTHOR_DESCRIPTION: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("body > table:nth-child(23) > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(2) > span").unwrap()
});
static SELECTOR_AUTHOR_IMAGE: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("body > table:nth-child(23) > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td:nth-child(1) > div:nth-child(1) > img").unwrap()
});
static SELECTOR_NOVEL_URLS: Lazy<Selector> = Lazy::new(|| {
    Selector::parse("body > table:nth-child(2N+27) > tbody > tr > td a:not([target])").unwrap()
});

#[derive(Debug)]
struct JJAuthor {
    id: String,
    name: String,
    description: String,
    image: String,
    novel_ids: Vec<String>,
}

#[async_trait::async_trait]
impl AuthorFn for JJAuthor {
    type Novel = JJNovel;
    async fn get_author_data(author_id: &str) -> NovelResult<Self> {
        let url = format!("https://www.jjwxc.net/oneauthor.php?authorid={}", author_id);
        let image_doc = text_from_url(&url, "gb18030").await?;
        let image_doc = Html::parse_document(&image_doc);

        // 图片
        let image = parse_image_src(&image_doc, &SELECTOR_AUTHOR_IMAGE)?;
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
        let data = format!("https://www.jjwxc.net/oneauthor.php?authorid={}", self.id);
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
        let data = try_join_all(self.novel_ids.iter().map(|x| JJNovel::get_novel_data(x))).await?;
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
    let (input, (_, data, _)) =
        all_consuming(tuple((tag("/book2/"), take_while(|_| true), eof)))(input)?;
    Ok((input, data.to_string()))
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn novel_id_test() -> anyhow::Result<()> {
        let input = "/book2/369639";
        let (input, id) = novel_id(input)?;
        assert_eq!(id, "369639");
        assert_eq!(input, "");
        Ok(())
    }

    #[tokio::test]
    async fn jj_author_test() -> anyhow::Result<()> {
        let author = JJAuthor::get_author_data("1000001").await?;
        println!("{:#?}", author);
        Ok(())
    }
}
