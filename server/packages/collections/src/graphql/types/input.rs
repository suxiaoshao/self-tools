/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 12:18:30
 * @FilePath: /self-tools/server/packages/collections/src/graphql/types/input.rs
 */
use async_graphql::InputObject;
use time::OffsetDateTime;

use crate::common::Paginate;

#[derive(InputObject, Debug, Clone, Copy)]
pub(crate) struct Pagination {
    #[graphql(validator(minimum = 1))]
    pub(crate) page: i64,
    #[graphql(validator(minimum = 5, maximum = 100))]
    pub(crate) page_size: i64,
}

impl Paginate for Pagination {
    fn offset(&self) -> i64 {
        (self.page - 1) * self.page_size
    }
    fn offset_plus_limit(&self) -> i64 {
        self.offset() + self.page_size
    }
    fn limit(&self) -> i64 {
        self.page_size
    }
}

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
