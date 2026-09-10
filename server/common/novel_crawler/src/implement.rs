/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-04 20:58:56
 * @FilePath: /self-tools/server/common/novel_crawler/src/implement/mod.rs
 */
use scraper::{Html, Selector};

use crate::errors::{NovelError, NovelResult};

mod http;
mod jjwxc;
mod qidian;

pub use jjwxc::*;
pub use qidian::*;

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
    let text = element_ref
        .text()
        .map(|x| x.trim())
        .collect::<Vec<_>>()
        .join("\n");
    Ok(text.trim().to_string())
}

fn parse_inner_html(html: &Html, selector: &Selector) -> NovelResult<String> {
    let element_ref = html.select(selector).next().ok_or(NovelError::ParseError)?;
    let text = element_ref.inner_html();
    Ok(text)
}
