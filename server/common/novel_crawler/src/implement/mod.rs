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

fn parse_urls(html: &Html, selector: &Selector) -> NovelResult<Vec<(String, String)>> {
    use scraper::ElementRef;
    fn filter_map_url(element: ElementRef) -> Option<(String, String)> {
        let url = element.value().attr("href")?.to_string();
        let name = element.text().collect::<Vec<_>>().join("");
        Some((url, name))
    }
    let element_ref = html.select(selector).filter_map(filter_map_url).collect();
    Ok(element_ref)
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
