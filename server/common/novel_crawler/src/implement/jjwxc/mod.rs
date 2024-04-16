/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-03 17:04:59
 * @FilePath: /self-tools/server/common/novel_crawler/src/implement/jjwxc/mod.rs
 */
pub mod author;
pub mod chapter;
pub mod novel;

pub use author::JJAuthor;
pub use chapter::JJChapter;
pub use novel::JJNovel;
