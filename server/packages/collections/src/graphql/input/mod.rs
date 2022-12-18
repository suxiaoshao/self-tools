use std::collections::HashSet;

use async_graphql::InputObject;

#[derive(InputObject)]
pub struct TagMatch {
    pub match_set: HashSet<i64>,
    pub full_match: bool,
}
