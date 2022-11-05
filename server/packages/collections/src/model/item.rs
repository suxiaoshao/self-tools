use super::schema::item;
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct ItemModel {
    pub id: i64,
    pub name: String,
    pub content: String,
    pub collection_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = item)]
struct NewCollection<'a> {
    pub name: &'a str,
    pub content: &'a str,
    pub collection_id: i64,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
