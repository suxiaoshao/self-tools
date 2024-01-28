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
pub struct Pagination {
    #[graphql(validator(minimum = 1))]
    pub page: i64,
    #[graphql(validator(minimum = 5, maximum = 100))]
    pub page_size: i64,
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
pub struct TimeRange {
    pub start: OffsetDateTime,
    pub end: OffsetDateTime,
}

#[derive(InputObject, Debug, Clone, Copy)]
pub struct CollectionItemQuery {
    pub id: Option<i64>,
    pub create_time: Option<TimeRange>,
    pub update_time: Option<TimeRange>,
    pub pagination: Pagination,
}
