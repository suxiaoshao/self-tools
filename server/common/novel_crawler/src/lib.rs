/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-03 17:06:51
 * @FilePath: /self-tools/server/common/novel_crawler/src/lib.rs
 */
pub mod author;
pub mod chapter;
mod errors;
mod implement;
pub mod novel;

pub use author::AuthorFn;
pub use chapter::*;
pub use errors::*;
pub use implement::*;
pub use novel::NovelFn;
