/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 07:35:34
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/input/mod.rs
 */
use std::collections::HashSet;

use async_graphql::InputObject;

#[derive(InputObject)]
pub(crate) struct TagMatch {
    pub(crate) match_set: HashSet<i64>,
    pub(crate) full_match: bool,
}
