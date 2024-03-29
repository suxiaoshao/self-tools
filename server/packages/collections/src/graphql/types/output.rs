use async_graphql::{OutputType, SimpleObject, Union};

use crate::service::{collection::Collection, item::Item};

#[derive(Union)]
pub enum ItemAndCollection {
    Item(Item),
    Collection(Collection),
}

#[derive(SimpleObject)]
pub struct List<DATA>
where
    DATA: OutputType,
{
    data: Vec<DATA>,
    total: i64,
}

impl<DATA> List<DATA>
where
    DATA: OutputType,
{
    pub fn new(data: Vec<DATA>, total: i64) -> Self {
        Self { data, total }
    }
}
