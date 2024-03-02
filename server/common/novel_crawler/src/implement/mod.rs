/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-02 19:07:44
 * @FilePath: /self-tools/server/common/novel_crawler/src/implement/mod.rs
 */
use scraper::{Html, Selector};

use crate::errors::{NovelError, NovelResult};

mod jjwxc;
mod qidian;

pub use jjwxc::*;
pub use qidian::*;

async fn get_doc(url: &str, charset: &str) -> NovelResult<Html> {
    let body = reqwest::get(url).await?.text_with_charset(charset).await?;
    let document = Html::parse_document(&body);
    Ok(document)
}

async fn text_from_url(url: &str, charset: &str) -> NovelResult<String> {
    let client = reqwest::Client::new().get(url).header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    let body = client.send().await?.text_with_charset(charset).await?;
    Ok(body)
}

fn parse_image_src(html: &Html, selector: &Selector) -> NovelResult<String> {
    parse_attr(html, selector, "src")
}

fn parse_attr(html: &Html, selector: &Selector, attr: &str) -> NovelResult<String> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let url = element_ref
        .value()
        .attr(attr)
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
