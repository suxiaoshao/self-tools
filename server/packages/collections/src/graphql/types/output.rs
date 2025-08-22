use async_graphql::Union;

use crate::service::{collection::Collection, item::Item};

#[derive(Union)]
pub(crate) enum ItemAndCollection {
    Item(Item),
    Collection(Collection),
}
