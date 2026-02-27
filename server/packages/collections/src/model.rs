use std::env;

use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

use crate::errors::GraphqlResult;

pub(crate) mod collection;
pub(crate) mod collection_item;
pub(crate) mod item;
pub(crate) mod schema;

pub(crate) type PgPool = Pool<ConnectionManager<PgConnection>>;

pub(crate) fn get_pool() -> GraphqlResult<PgPool> {
    let database_url = env::var("COLLECTIONS_PG")?;
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    let pool = Pool::builder().test_on_check_out(true).build(manager)?;
    Ok(pool)
}
