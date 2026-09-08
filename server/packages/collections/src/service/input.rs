use service_query::PageRange;
use time::OffsetDateTime;
#[derive(Debug, Clone, Copy)]
pub(crate) struct TimeRange {
    pub start: OffsetDateTime,
    pub end: OffsetDateTime,
}
impl TimeRange {
    pub fn start(&self) -> OffsetDateTime {
        self.start
    }
    pub fn end(&self) -> OffsetDateTime {
        self.end
    }
}
#[derive(Debug, Clone, Copy)]
pub(crate) struct CollectionItemQuery {
    pub id: Option<i64>,
    pub create_time: Option<TimeRange>,
    pub update_time: Option<TimeRange>,
    pub pagination: PageRange,
}
pub(crate) enum ItemAndCollection {
    Item(super::item::Item),
    Collection(super::collection::Collection),
}
