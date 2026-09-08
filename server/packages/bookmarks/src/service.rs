/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 14:26:04
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/mod.rs
 */
pub(crate) mod author;
pub(crate) mod chapter;
pub(crate) mod collection;
pub(crate) mod novel;
pub(crate) mod novel_comment;
pub(crate) mod save_draft;
pub(crate) mod tag;
mod utils;

/// All writes share a short transaction lock because several domain relationships lack FKs.
/// External fetching happens before this lock. Reads remain concurrent.
pub(crate) fn write<T>(
    conn: &mut diesel::PgConnection,
    f: impl FnOnce(&mut diesel::PgConnection) -> crate::errors::AppResult<T>,
) -> crate::errors::AppResult<T> {
    use diesel::{Connection, RunQueryDsl};
    conn.transaction(|conn| {
  diesel::sql_query("LOCK TABLE author, chapter, collection, collection_novel, novel, novel_comment, read_record, tag IN SHARE ROW EXCLUSIVE MODE").execute(conn)?;
  f(conn)
 })
}
