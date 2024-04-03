/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-01 03:57:54
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
pub enum NovelStatus {
    Ongoing,
    Completed,
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

impl From<novel_crawler::novel::NovelStatus> for NovelStatus {
    fn from(value: novel_crawler::novel::NovelStatus) -> Self {
        match value {
            novel_crawler::novel::NovelStatus::Ongoing => NovelStatus::Ongoing,
            novel_crawler::novel::NovelStatus::Completed => NovelStatus::Completed,
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
