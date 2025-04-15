use async_graphql::{OutputType, SimpleObject, Union};

use crate::service::{collection::Collection, item::Item};

#[derive(Union)]
pub(crate) enum ItemAndCollection {
    Item(Item),
    Collection(Collection),
}

#[derive(SimpleObject)]
pub(crate) struct List<DATA>
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
    pub(crate) fn new(data: Vec<DATA>, total: i64) -> Self {
        Self { data, total }
    }
}
