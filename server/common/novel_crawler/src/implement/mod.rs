use scraper::{Html, Selector};

use crate::errors::{NovelError, NovelResult};

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

fn parse_url(html: &Html, selector: &Selector) -> NovelResult<(String, String)> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let url = element_ref
        .value()
        .attr("href")
        .ok_or(NovelError::ParseError)?
        .to_string();
    let text = element_ref.inner_html();
    Ok((url, text))
}

fn parse_image_src(html: &Html, selector: &Selector) -> NovelResult<String> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let url = element_ref
        .value()
        .attr("src")
        .ok_or(NovelError::ParseError)?
        .to_string();
    Ok(url)
}

fn parse_text(html: &Html, selector: &Selector) -> NovelResult<String> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let text = element_ref.text().fold(String::new(), |mut acc, x| {
        acc.push_str(x);
        acc
    });
    Ok(text)
}

fn parse_inner_html(html: &Html, selector: &Selector) -> NovelResult<String> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let text = element_ref.inner_html();
    Ok(text)
}
