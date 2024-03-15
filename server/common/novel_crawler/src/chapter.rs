/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-15 05:10:42
 * @FilePath: /self-tools/server/common/novel_crawler/src/chapter.rs
 */
pub trait ChapterFn: Sized + Send {
    fn url(&self) -> String;
    fn title(&self) -> &str;
    fn chapter_id(&self) -> &str;
    fn novel_id(&self) -> &str;
    fn word_count(&self) -> u32;
    fn time(&self) -> &str;
    fn get_url_from_id(chapter_id: &str, novel_id: &str) -> String;
}

pub trait ChapterDetail: ChapterFn {
    fn content(&self) -> &str;
}
