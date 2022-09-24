use scraper::{Html, Selector};

use crate::errors::{NovelError, NovelResult};

mod jjwxc;
mod qidian;

async fn get_doc(url: &str, charset: &str) -> NovelResult<Html> {
    let body = reqwest::get(url).await?.text_with_charset(charset).await?;
    let document = Html::parse_document(&body);
    Ok(document)
}

async fn text_from_url(url: &str, charset: &str) -> NovelResult<String> {
    let body = reqwest::get(url).await?.text_with_charset(charset).await?;
    Ok(body)
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
        acc.push('\n');
        acc.push_str(x.trim());
        acc
    });
    Ok(text)
}

fn parse_inner_html(html: &Html, selector: &Selector) -> NovelResult<String> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let text = element_ref.inner_html();
    Ok(text)
}
