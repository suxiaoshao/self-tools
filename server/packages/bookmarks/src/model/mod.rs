/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-23 22:00:42
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/mod.rs
 */
use std::env;
pub(crate) mod schema;
use diesel::{
    r2d2::{ConnectionManager, Pool},
    PgConnection,
};

use crate::errors::GraphqlResult;

pub(crate) mod author;
pub(crate) mod chapter;
pub(crate) mod collection;
pub(crate) mod novel;
pub(crate) mod tag;

pub(crate) type PgPool = Pool<ConnectionManager<PgConnection>>;

pub(crate) fn get_pool() -> GraphqlResult<PgPool> {
    let database_url = env::var("BOOKMARKS_PG")?;
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    let pool = Pool::builder().test_on_check_out(true).build(manager)?;
    Ok(pool)
}
