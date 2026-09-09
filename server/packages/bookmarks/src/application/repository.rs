use std::env;
pub(in crate::application) mod schema;
use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};

use crate::errors::AppResult;

pub(in crate::application) mod author;
pub(in crate::application) mod chapter;
pub(in crate::application) mod collection;
pub(in crate::application) mod collection_novel;
pub(in crate::application) mod novel;
pub(in crate::application) mod novel_comment;
pub(in crate::application) mod read_record;
pub(in crate::application) mod tag;

pub(in crate::application) type PgPool = Pool<ConnectionManager<PgConnection>>;

pub(in crate::application) fn get_pool() -> AppResult<PgPool> {
    let database_url = env::var("BOOKMARKS_PG").map_err(|e| {
        service_errors::Fault::new(service_errors::FaultKind::Internal, "database_config", e)
    })?;
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    let pool = Pool::builder()
        .max_size(10)
        .connection_timeout(std::time::Duration::from_secs(5))
        .test_on_check_out(true)
        .build(manager)?;
    Ok(pool)
}
