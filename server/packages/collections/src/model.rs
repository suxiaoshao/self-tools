use std::env;

use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

use crate::errors::AppResult;

pub(crate) mod collection;
pub(crate) mod collection_item;
pub(crate) mod item;
pub(crate) mod schema;

pub(crate) type PgPool = Pool<ConnectionManager<PgConnection>>;

pub(crate) fn get_pool() -> AppResult<PgPool> {
    let database_url = env::var("COLLECTIONS_PG").map_err(|error| {
        service_errors::Fault::new(
            service_errors::FaultKind::Internal,
            "database_config",
            error,
        )
    })?;
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    let pool = Pool::builder()
        .connection_timeout(std::time::Duration::from_secs(5))
        .test_on_check_out(true)
        .build(manager)?;
    Ok(pool)
}
