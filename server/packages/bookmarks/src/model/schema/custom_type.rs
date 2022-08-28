use async_graphql::Enum;
use std::io::Write;

use diesel::{
    deserialize,
    pg::Pg,
    serialize::{self, IsNull, Output},
    types::{FromSql, ToSql},
};

#[derive(SqlType, Debug, FromSqlRow, AsExpression, Enum, Copy, Clone, Eq, PartialEq, QueryId)]
#[postgres(type_name = "read_status")]
#[sql_type = "ReadStatus"]
pub enum ReadStatus {
    #[postgres(name = "read")]
    Read,
    #[postgres(name = "unread")]
    Unread,
    #[postgres(name = "reading")]
    Reading,
}

impl ToSql<ReadStatus, Pg> for ReadStatus {
    fn to_sql<W: Write>(&self, out: &mut Output<W, Pg>) -> serialize::Result {
        match *self {
            ReadStatus::Read => out.write_all(b"read")?,
            ReadStatus::Unread => out.write_all(b"unread")?,
            ReadStatus::Reading => out.write_all(b"reading")?,
        }
        Ok(IsNull::No)
    }
}

impl FromSql<ReadStatus, Pg> for ReadStatus {
    fn from_sql(bytes: Option<&[u8]>) -> deserialize::Result<Self> {
        match not_none!(bytes) {
            b"read" => Ok(ReadStatus::Read),
            b"unread" => Ok(ReadStatus::Unread),
            b"reading" => Ok(ReadStatus::Reading),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}
