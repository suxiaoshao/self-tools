/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-03 17:06:51
 * @FilePath: /self-tools/server/common/novel_crawler/src/lib.rs
 */
mod author;
mod chapter;
mod errors;
mod implement;
mod novel;
mod tag;

pub use author::AuthorFn;
pub use chapter::{ChapterDetail, ChapterFn};
pub use errors::NovelError;
pub use implement::{JJAuthor, JJChapter, JJNovel, QDAuthor, QDChapter, QDNovel};
pub use novel::{NovelFn, NovelStatus};
pub use tag::TagFn;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NovelSite {
    Qidian,
    Jjwxc,
}
