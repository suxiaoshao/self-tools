/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-02 21:49:58
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/input/mod.rs
 */
use std::collections::HashSet;

use async_graphql::{Enum, InputObject};

#[derive(InputObject)]
pub struct TagMatch {
    pub match_set: HashSet<i64>,
    pub full_match: bool,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq, Debug)]
pub enum NovelSite {
    Jjwxc,
    Qidian,
}
