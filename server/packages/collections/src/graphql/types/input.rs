use async_graphql::InputObject;
use time::OffsetDateTime;

#[derive(InputObject, Debug)]
pub struct Pagination {
    #[graphql(validator(minimum = 1))]
    pub page: i64,
    #[graphql(validator(minimum = 5, maximum = 100))]
    pub page_size: i64,
}

impl Pagination {
    pub fn offset(&self) -> i64 {
        (self.page - 1) * self.page_size
    }
    pub fn offset_plus_limit(&self) -> i64 {
        self.offset() + self.page_size
    }
}

#[derive(InputObject, Debug)]
pub struct TimeRange {
    pub start: OffsetDateTime,
    pub end: OffsetDateTime,
}