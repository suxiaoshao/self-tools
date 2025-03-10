/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:34:17
 * @FilePath: /self-tools/server/common/novel_crawler/src/novel.rs
 */
use crate::{chapter::ChapterFn, errors::NovelResult, tag::TagFn, AuthorFn};
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NovelStatus {
    Ongoing,
    Completed,
    Paused,
}
pub trait NovelFn: Sized + Send + Sync + Sized {
    type Chapter: ChapterFn;
    type Author: AuthorFn;
    type Tag: TagFn;
    fn get_novel_data(
        novel_id: &str,
    ) -> impl std::future::Future<Output = NovelResult<Self>> + Send;
    fn url(&self) -> String;
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn image(&self) -> &str;
    fn chapters(&self)
        -> impl std::future::Future<Output = NovelResult<Vec<Self::Chapter>>> + Send;
    fn author_id(&self) -> &str;
    fn author(&self) -> impl std::future::Future<Output = NovelResult<Self::Author>> + Send {
        async { Self::Author::get_author_data(self.author_id()).await }
    }
    fn get_url_from_id(id: &str) -> String;
    fn status(&self) -> NovelStatus;
    fn id(&self) -> &str;
    fn tags(&self) -> &[Self::Tag];
}
