use std::{env, sync::LazyLock};

use diesel::{
    r2d2::{ConnectionManager, Pool},
    PgConnection,
};

pub mod collection;
pub mod item;
pub mod schema;

type PgPool = Pool<ConnectionManager<PgConnection>>;
pub static CONNECTION: LazyLock<PgPool> = LazyLock::new(|| {
    let database_url = env::var("COLLECTIONS_PG").expect("DATABASE_URL must be set");
    let manager = ConnectionManager::<PgConnection>::new(database_url);

    Pool::builder()
        .test_on_check_out(true)
        .build(manager)
        .expect("Failed to create pool.")
});
