/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-21 20:38:32
 * @FilePath: /self-tools/server/common/novel_crawler/src/author.rs
 */
use crate::{errors::NovelResult, novel::NovelFn};

pub trait AuthorFn: Sized + Send + Sync {
    type Novel: NovelFn;
    fn get_author_data(
        author_id: &str,
    ) -> impl std::future::Future<Output = NovelResult<Self>> + Send;
    fn url(&self) -> String;
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn image(&self) -> &str;
    fn novels(&self) -> impl std::future::Future<Output = NovelResult<Vec<Self::Novel>>> + Send;
    fn get_url_from_id(id: &str) -> String;
    fn id(&self) -> &str;
}
