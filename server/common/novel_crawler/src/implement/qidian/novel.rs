use nom::{
    bytes::complete::{tag, take_until},
    sequence::tuple,
    IResult,
};
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

use crate::{
    errors::NovelResult,
    implement::{parse_image_src, parse_inner_html, parse_text, text_from_url},
    novel::NovelFn,
};

use super::chapter::QDChapter;

static SELECTOR_NOVEL_NAME: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#bookDetailWrapper > div > div > div > h2").unwrap());
static SELECTOR_NOVEL_DESCRIPTION: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#bookSummary > content").unwrap());
static SELECTOR_NOVEL_IMAGE: Lazy<Selector> =
    Lazy::new(|| Selector::parse("#bookDetailWrapper > div > div > img").unwrap());

#[derive(Debug)]
pub(crate) struct QDNovel {
    id: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<QDChapter>,
}

#[async_trait::async_trait]
impl NovelFn for QDNovel {
    type Chapter = QDChapter;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self> {
        let (html, chapter_html) = Self::get_doc(novel_id).await?;
        let html = Html::parse_document(&html);
        let name = parse_inner_html(&html, &SELECTOR_NOVEL_NAME)?;
        let description = parse_text(&html, &SELECTOR_NOVEL_DESCRIPTION)?;
        let image = parse_image_src(&html, &SELECTOR_NOVEL_IMAGE)?;
        let image = format!("https:{}", image);
        let chapters = parse_chapters(&chapter_html, novel_id)?;
        Ok(Self {
            id: novel_id.to_string(),
            name,
            description,
            image,
            chapters,
        })
    }

    fn url(&self) -> String {
        format!("https://m.qidian.com/book/{}.html", self.id)
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

impl QDNovel {
    pub(crate) async fn get_doc(id: &str) -> NovelResult<(String, String)> {
        let url = format!("https://m.qidian.com/book/{}.html", id);
        let chapter_url = format!("https://m.qidian.com/book/{}/catalog/", id);
        let data = tokio::try_join!(
            text_from_url(&url, "utf-8"),
            text_from_url(&chapter_url, "utf-8")
        )?;
        Ok(data)
    }
}

fn parse_chapters(html: &str, novel_id: &str) -> NovelResult<Vec<QDChapter>> {
    fn parse_json(input: &str) -> IResult<&str, &str> {
        let (input, (_, _, data)) = tuple((
            take_until("g_data.volumes = "),
            tag("g_data.volumes = "),
            take_until(";"),
        ))(input)?;
        Ok((input, data))
    }
    let (_, data) = parse_json(html)?;
    #[derive(serde::Deserialize, Debug)]
    struct Data {
        cs: Vec<Chapter>,
    }
    #[derive(serde::Deserialize, Debug)]
    struct Chapter {
        id: i32,
        #[serde(rename = "cN")]
        name: String,
    }
    let data: Vec<Data> = serde_json::from_str(data)?;
    let data = data
        .into_iter()
        .flat_map(|d| d.cs)
        .map(|Chapter { id, name }| QDChapter::new(novel_id.to_string(), id.to_string(), name))
        .collect();
    Ok(data)
}

#[cfg(test)]
mod test {
    use crate::novel::NovelFn;

    #[tokio::test]
    async fn jj_novel_test() -> anyhow::Result<()> {
        let novel_id = "1029006481";
        let novel = super::QDNovel::get_novel_data(novel_id).await?;
        println!("{:#?}", novel);
        Ok(())
    }
}
