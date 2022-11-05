use diesel::prelude::*;
use time::{OffsetDateTime};
use super::schema::collection;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct CollectionModel {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub parent_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = collection)]
struct NewCollection<'a> {
    pub name: &'a str,
    pub description: Option<String>,
    pub parent_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}