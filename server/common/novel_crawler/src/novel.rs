/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 06:55:02
 * @FilePath: /self-tools/server/common/novel_crawler/src/novel.rs
 */
use crate::{chapter::ChapterFn, errors::NovelResult};
pub(crate) trait NovelFn: Sized {
    type Chapter: ChapterFn;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self>;
    fn url(&self) -> String;
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn image(&self) -> &str;
    async fn chapters(&self) -> NovelResult<Vec<Self::Chapter>>;
}
