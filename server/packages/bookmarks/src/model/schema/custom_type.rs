/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-24 16:20:32
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/schema/custom_type.rs
 */
use async_graphql::Enum;
use std::{
    fmt::{self, Display, Formatter},
    io::Write,
};
use tracing::{event, Level};

use diesel::{
    deserialize::{self, FromSql, FromSqlRow},
    expression::AsExpression,
    pg::{Pg, PgValue},
    serialize::{self, IsNull, Output, ToSql},
    QueryId,
};

#[derive(Debug, FromSqlRow, AsExpression, QueryId, Enum, Copy, Clone, Eq, PartialEq)]
#[diesel(sql_type = super::sql_types::NovelStatus)]
pub(crate) enum NovelStatus {
    Ongoing,
    Completed,
}

impl From<&novel_crawler::NovelStatus> for NovelStatus {
    fn from(value: &novel_crawler::NovelStatus) -> Self {
        match value {
            novel_crawler::NovelStatus::Ongoing => NovelStatus::Ongoing,
            novel_crawler::NovelStatus::Completed => NovelStatus::Completed,
        }
    }
}

impl PartialEq<novel_crawler::NovelStatus> for NovelStatus {
    fn eq(&self, other: &novel_crawler::NovelStatus) -> bool {
        matches!(
            (self, other),
            (NovelStatus::Ongoing, novel_crawler::NovelStatus::Ongoing)
                | (
                    NovelStatus::Completed,
                    novel_crawler::NovelStatus::Completed
                )
        )
    }
}

impl ToSql<super::sql_types::NovelStatus, Pg> for NovelStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            NovelStatus::Ongoing => out.write_all(b"ongoing")?,
            NovelStatus::Completed => out.write_all(b"completed")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<super::sql_types::NovelStatus, Pg> for NovelStatus {
    fn from_sql(bytes: PgValue) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"ongoing" => Ok(NovelStatus::Ongoing),
            b"completed" => Ok(NovelStatus::Completed),
            _ => {
                event!(
                    Level::ERROR,
                    "Unrecognized enum variant {:x?}",
                    bytes.as_bytes()
                );
                Err("Unrecognized enum variant".into())
            }
        }
    }
}

impl From<novel_crawler::NovelStatus> for NovelStatus {
    fn from(value: novel_crawler::NovelStatus) -> Self {
        match value {
            novel_crawler::NovelStatus::Ongoing => NovelStatus::Ongoing,
            novel_crawler::NovelStatus::Completed => NovelStatus::Completed,
        }
    }
}

#[derive(Debug, FromSqlRow, AsExpression, QueryId, Enum, Copy, Clone, Eq, PartialEq)]
#[diesel(sql_type = super::sql_types::NovelSite)]
pub enum NovelSite {
    Qidian,
    Jjwxc,
}

impl Display for NovelSite {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            NovelSite::Qidian => write!(f, "起点"),
            NovelSite::Jjwxc => write!(f, "晋江"),
        }
    }
}

impl ToSql<super::sql_types::NovelSite, Pg> for NovelSite {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            NovelSite::Qidian => out.write_all(b"qidian")?,
            NovelSite::Jjwxc => out.write_all(b"jjwxc")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<super::sql_types::NovelSite, Pg> for NovelSite {
    fn from_sql(bytes: PgValue) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"qidian" => Ok(NovelSite::Qidian),
            b"jjwxc" => Ok(NovelSite::Jjwxc),
            _ => {
                event!(
                    Level::ERROR,
                    "Unrecognized enum variant {:x?}",
                    bytes.as_bytes()
                );
                Err("Unrecognized enum variant".into())
            }
        }
    }
}

impl From<novel_crawler::NovelSite> for NovelSite {
    fn from(value: novel_crawler::NovelSite) -> Self {
        match value {
            novel_crawler::NovelSite::Qidian => NovelSite::Qidian,
            novel_crawler::NovelSite::Jjwxc => NovelSite::Jjwxc,
        }
    }
}
