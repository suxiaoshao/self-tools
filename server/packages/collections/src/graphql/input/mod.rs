use std::collections::HashSet;

use async_graphql::{InputObject, Union};

use crate::service::{collection::Collection, item::Item};

#[derive(InputObject)]
pub struct TagMatch {
    pub match_set: HashSet<i64>,
    pub full_match: bool,
}

#[derive(Union)]
pub enum ItemAndCollection {
    Item(Item),
    Collection(Collection),
}

#[derive(InputObject)]
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
