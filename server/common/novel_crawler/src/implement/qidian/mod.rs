/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-03 17:09:37
 * @FilePath: /self-tools/server/common/novel_crawler/src/implement/qidian/mod.rs
 */
pub(crate) mod author;
pub(crate) mod chapter;
pub(crate) mod novel;

pub use author::QDAuthor;
pub use chapter::QDChapter;
pub use novel::QDNovel;
