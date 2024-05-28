/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-30 23:14:17
 * @FilePath: /self-tools/server/common/novel_crawler/src/chapter.rs
 */
pub trait ChapterFn: Sized + Send {
    type Author: crate::AuthorFn;
    type Novel: crate::NovelFn;
    fn url(&self) -> String;
    fn title(&self) -> &str;
    fn chapter_id(&self) -> &str;
    fn novel_id(&self) -> &str;
    fn word_count(&self) -> u32;
    fn time(&self) -> time::OffsetDateTime;
    fn get_url_from_id(chapter_id: &str, novel_id: &str) -> String;
}

pub trait ChapterDetail: ChapterFn {
    fn content(&self) -> &str;
}
