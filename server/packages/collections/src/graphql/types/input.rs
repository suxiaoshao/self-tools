/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 12:18:30
 * @FilePath: /self-tools/server/packages/collections/src/graphql/types/input.rs
 */
use async_graphql::InputObject;
use graphql_common::Pagination;
use time::OffsetDateTime;

#[derive(InputObject, Debug, Clone, Copy)]
pub(crate) struct TimeRange {
    pub(crate) start: OffsetDateTime,
    pub(crate) end: OffsetDateTime,
}

#[derive(InputObject, Debug, Clone, Copy)]
pub(crate) struct CollectionItemQuery {
    pub(crate) id: Option<i64>,
    pub(crate) create_time: Option<TimeRange>,
    pub(crate) update_time: Option<TimeRange>,
    pub(crate) pagination: Pagination,
}
