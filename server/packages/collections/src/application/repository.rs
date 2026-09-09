use std::env;

use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

use crate::errors::AppResult;

pub(in crate::application) mod collection;
pub(in crate::application) mod collection_item;
pub(in crate::application) mod item;
pub(in crate::application) mod schema;

pub(in crate::application) type PgPool = Pool<ConnectionManager<PgConnection>>;

pub(in crate::application) fn get_pool() -> AppResult<PgPool> {
    let database_url = env::var("COLLECTIONS_PG").map_err(|error| {
        service_errors::Fault::new(
            service_errors::FaultKind::Internal,
            "database_config",
            error,
        )
    })?;
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    let pool = Pool::builder()
        .max_size(10)
        .connection_timeout(std::time::Duration::from_secs(5))
        .test_on_check_out(true)
        .build(manager)?;
    Ok(pool)
}
