/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 12:18:30
 * @FilePath: /self-tools/server/packages/collections/src/graphql/types/input.rs
 */
use async_graphql::InputObject;
use graphql_common::{DateTime, Pagination};

#[derive(InputObject, Debug, Clone, Copy)]
pub(crate) struct TimeRange {
    pub start: DateTime,
    pub end: DateTime,
}

#[derive(InputObject, Debug, Clone, Copy)]
pub(crate) struct CollectionItemQuery {
    pub(crate) id: Option<i64>,
    pub(crate) create_time: Option<TimeRange>,
    pub(crate) update_time: Option<TimeRange>,
    pub(crate) pagination: Pagination,
}

impl CollectionItemQuery {
    pub fn checked(self) -> async_graphql::Result<crate::application::input::CollectionItemQuery> {
        let pagination = self.pagination.checked().map_err(|mut v| {
            v.path.splice(0..0, ["query".into(), "pagination".into()]);
            graphql_common::invalid_fields(vec![v])
        })?;
        Ok(crate::application::input::CollectionItemQuery {
            id: self.id,
            create_time: self.create_time.map(Into::into),
            update_time: self.update_time.map(Into::into),
            pagination,
        })
    }
}
impl From<TimeRange> for crate::application::input::TimeRange {
    fn from(v: TimeRange) -> Self {
        Self {
            start: v.start.into(),
            end: v.end.into(),
        }
    }
}
