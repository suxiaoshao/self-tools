use scraper::Html;

use crate::errors::NovelResult;

mod jjwxc;

async fn get_doc(url: &str) -> NovelResult<Html> {
    let body = reqwest::get(url).await?.text().await?;
    let document = Html::parse_document(&body);
    Ok(document)
}
async fn text_from_url(url: &str) -> NovelResult<String> {
    let body = reqwest::get(url).await?.text().await?;
    Ok(body)
}
