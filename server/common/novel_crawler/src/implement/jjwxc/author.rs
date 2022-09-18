use once_cell::sync::Lazy;
use scraper::{Html, Selector};

use crate::{
    author::AuthorFn,
    errors::{NovelError, NovelResult},
    implement::{get_doc, text_from_url},
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

struct JJAuthor {
    url: String,
    name: String,
    description: String,
    image: String,
    novels: Vec<JJNovel>,
}
#[async_trait::async_trait]
impl AuthorFn for JJAuthor {
    type Novel = JJNovel;
    async fn get_author_data(author_id: &str) -> NovelResult<Self> {
        let (image_doc, doc, url) = Self::html(author_id).await?;
        let image_doc = Html::parse_document(&image_doc);
        let doc = Html::parse_document(&doc);

        // 图片
        let image = image_doc
            .select(&SELECTOR_AUTHOR_IMAGE)
            .next()
            .ok_or(NovelError::ParseError)?
            .value()
            .attr("src")
            .ok_or(NovelError::ParseError)?
            .to_string();
        // 其他
        let name = image_doc
            .select(&SELECTOR_AUTHOR_NAME)
            .next()
            .ok_or(NovelError::ParseError)?
            .inner_html();
        let description = image_doc
            .select(&SELECTOR_AUTHOR_DESCRIPTION)
            .next()
            .ok_or(NovelError::ParseError)?
            .text()
            .fold(String::new(), |mut acc, x| {
                acc.push_str(x);
                acc
            });

        Ok(Self {
            url,
            name,
            description,
            image,
            novels: todo!(),
        })
    }

    fn url(&self) -> &str {
        self.url.as_str()
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
    async fn novels(&self) -> &[Self::Novel] {
        self.novels.as_slice()
    }
}

impl JJAuthor {
    async fn html(author_id: &str) -> NovelResult<(String, String, String)> {
        let image_url = format!("https://www.jjwxc.net/oneauthor.php?authorid={}", author_id);
        let url = format!("https://m.jjwxc.net/wapauthor/{}", author_id);

        let (image_doc, doc) = tokio::try_join!(text_from_url(&image_url), text_from_url(&url))?;
        Ok((image_doc, doc, url))
    }
}
