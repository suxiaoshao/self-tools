use async_graphql::Enum;
use std::io::Write;
use tracing::{event, Level};

use diesel::{
    deserialize::{self, FromSql, FromSqlRow},
    expression::AsExpression,
    pg::{Pg, PgValue},
    serialize::{self, IsNull, Output, ToSql},
    QueryId,
};

#[derive(Debug, FromSqlRow, AsExpression, QueryId, Enum, Copy, Clone, Eq, PartialEq)]
#[diesel(sql_type = super::sql_types::ReadStatus)]
pub enum ReadStatus {
    Read,
    Unread,
    Reading,
}

impl ToSql<super::sql_types::ReadStatus, Pg> for ReadStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> serialize::Result {
        match *self {
            ReadStatus::Read => out.write_all(b"read")?,
            ReadStatus::Unread => out.write_all(b"unread")?,
            ReadStatus::Reading => out.write_all(b"reading")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<super::sql_types::ReadStatus, Pg> for ReadStatus {
    fn from_sql(bytes: PgValue) -> deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"read" => Ok(ReadStatus::Read),
            b"unread" => Ok(ReadStatus::Unread),
            b"reading" => Ok(ReadStatus::Reading),
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
