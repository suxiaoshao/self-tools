/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-03 17:15:00
 * @FilePath: /self-tools/server/common/novel_crawler/src/author.rs
 */
use crate::{errors::NovelResult, novel::NovelFn};

pub trait AuthorFn: Sized + Send + Sync {
    type Novel: NovelFn;
    async fn get_author_data(author_id: &str) -> NovelResult<Self>;
    fn url(&self) -> String;
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn image(&self) -> &str;
    async fn novels(&self) -> NovelResult<Vec<Self::Novel>>;
}
