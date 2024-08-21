use std::{env, sync::LazyLock};

use diesel::{
    r2d2::{ConnectionManager, Pool},
    PgConnection,
};

pub(crate) mod collection;
pub(crate) mod item;
pub(crate) mod schema;

type PgPool = Pool<ConnectionManager<PgConnection>>;
pub(crate) static CONNECTION: LazyLock<PgPool> = LazyLock::new(|| {
    let database_url = env::var("COLLECTIONS_PG").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    Pool::builder()
        .test_on_check_out(true)
        .build(manager)
        .expect("Failed to create pool.")
});
