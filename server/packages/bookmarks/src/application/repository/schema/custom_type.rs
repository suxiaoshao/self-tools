use std::{
    fmt::{self, Display, Formatter},
    io::Write,
};

use diesel::{
    QueryId,
    deserialize::{self, FromSql, FromSqlRow},
    expression::AsExpression,
    pg::{Pg, PgValue},
    serialize::{self, IsNull, Output, ToSql},
};

#[derive(Debug, FromSqlRow, AsExpression, QueryId, Copy, Clone, Eq, PartialEq)]
#[diesel(sql_type = super::sql_types::NovelStatus)]
pub(in crate::application) enum NovelStatus {
    Ongoing,
    Completed,
    Paused,
}

impl ToSql<super::sql_types::NovelStatus, Pg> for NovelStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            NovelStatus::Ongoing => out.write_all(b"ongoing")?,
            NovelStatus::Completed => out.write_all(b"completed")?,
            NovelStatus::Paused => out.write_all(b"paused")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<super::sql_types::NovelStatus, Pg> for NovelStatus {
    fn from_sql(bytes: PgValue) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"ongoing" => Ok(NovelStatus::Ongoing),
            b"completed" => Ok(NovelStatus::Completed),
            b"paused" => Ok(NovelStatus::Paused),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

#[derive(Debug, FromSqlRow, AsExpression, QueryId, Copy, Clone, Eq, PartialEq)]
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
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

impl From<NovelSite> for crate::application::NovelSite {
    fn from(value: NovelSite) -> Self {
        match value {
            NovelSite::Qidian => Self::Qidian,
            NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}

impl From<crate::application::NovelSite> for NovelSite {
    fn from(value: crate::application::NovelSite) -> Self {
        match value {
            crate::application::NovelSite::Qidian => Self::Qidian,
            crate::application::NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}

impl From<NovelStatus> for crate::application::NovelStatus {
    fn from(value: NovelStatus) -> Self {
        match value {
            NovelStatus::Ongoing => Self::Ongoing,
            NovelStatus::Completed => Self::Completed,
            NovelStatus::Paused => Self::Paused,
        }
    }
}

impl From<crate::application::NovelStatus> for NovelStatus {
    fn from(value: crate::application::NovelStatus) -> Self {
        match value {
            crate::application::NovelStatus::Ongoing => Self::Ongoing,
            crate::application::NovelStatus::Completed => Self::Completed,
            crate::application::NovelStatus::Paused => Self::Paused,
        }
    }
}
