/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:13:03
 * @FilePath: /self-tools/server/common/novel_crawler/src/chapter.rs
 */
pub trait ChapterFn: Sized + Send {
    fn url(&self) -> String;
    fn title(&self) -> &str;
    fn chapter_id(&self) -> &str;
    fn novel_id(&self) -> &str;
}

pub trait ChapterDetail: ChapterFn {
    fn content(&self) -> &str;
}
