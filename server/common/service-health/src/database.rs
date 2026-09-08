use anyhow::{Result, anyhow, bail};
use diesel::{
    migration::MigrationSource,
    prelude::*,
    r2d2::{ConnectionManager, Pool},
    sql_types::Text,
};
use diesel_migrations::{EmbeddedMigrations, MigrationHarness};
use std::{collections::BTreeSet, time::Duration};

pub type PgPool = Pool<ConnectionManager<PgConnection>>;
#[derive(QueryableByName)]
struct Applied {
    #[diesel(sql_type = Text)]
    version: String,
}
fn expected(migrations: &EmbeddedMigrations) -> Result<BTreeSet<String>> {
    let migrations =
        <EmbeddedMigrations as MigrationSource<diesel::pg::Pg>>::migrations(migrations)
            .map_err(|_| anyhow!("invalid embedded migrations"))?;
    Ok(migrations
        .iter()
        .map(|m| m.name().version().to_string())
        .collect())
}
fn applied(db: &mut PgConnection) -> Result<BTreeSet<String>> {
    diesel::sql_query(
        "SELECT version::text AS version FROM __diesel_schema_migrations ORDER BY version",
    )
    .load::<Applied>(db)
    .map(|v| v.into_iter().map(|r| r.version).collect())
    .map_err(|_| anyhow!("schema unavailable; apply migrations explicitly"))
}

/// Reads only. MigrationHarness::applied_migrations creates the history table,
/// so readiness intentionally uses a plain query instead.
pub fn check(db: &mut PgConnection, migrations: EmbeddedMigrations) -> Result<()> {
    db.transaction::<_, anyhow::Error, _>(|db| {
        diesel::sql_query("SET LOCAL statement_timeout = '2s'")
            .execute(db)
            .map_err(|_| anyhow!("database unavailable"))?;
        if applied(db)? != expected(&migrations)? {
            bail!("schema version mismatch; apply migrations or use a compatible image");
        }
        Ok(())
    })
}

pub async fn ready(pool: PgPool, migrations: EmbeddedMigrations) -> bool {
    matches!(
        tokio::time::timeout(
            Duration::from_secs(5),
            tokio::task::spawn_blocking(move || {
                let mut db = pool
                    .get_timeout(Duration::from_secs(2))
                    .map_err(|_| anyhow!("database unavailable"))?;
                check(&mut db, migrations)
            })
        )
        .await,
        Ok(Ok(Ok(())))
    )
}

/// Explicit CLI operation, never called from normal startup or readiness.
pub fn migrate(env_name: &str, migrations: EmbeddedMigrations) -> Result<()> {
    let url = std::env::var(env_name).map_err(|_| anyhow!("{env_name} required"))?;
    let mut db =
        PgConnection::establish(&url).map_err(|_| anyhow!("database connection failed"))?;
    migrate_connection(&mut db, migrations)
}

fn migrate_connection(db: &mut PgConnection, migrations: EmbeddedMigrations) -> Result<()> {
    // A session lock serializes concurrent migration commands. Closing the
    // connection on any error releases it; no source SQL/details are printed.
    diesel::sql_query("SET lock_timeout = '5s'")
        .execute(db)
        .map_err(|_| anyhow!("database unavailable"))?;
    diesel::sql_query("SET statement_timeout = '5min'")
        .execute(db)
        .map_err(|_| anyhow!("database unavailable"))?;
    diesel::sql_query("SELECT pg_advisory_lock(10620260908)")
        .execute(db)
        .map_err(|_| anyhow!("migration lock unavailable"))?;
    #[derive(QueryableByName)]
    struct Present {
        #[diesel(sql_type = diesel::sql_types::Bool)]
        present: bool,
    }
    let present = diesel::sql_query(
        "SELECT to_regclass('__diesel_schema_migrations') IS NOT NULL AS present",
    )
    .get_result::<Present>(db)
    .map_err(|_| anyhow!("schema check failed"))?
    .present;
    let wanted = expected(&migrations)?;
    if present && !applied(db)?.is_subset(&wanted) {
        bail!("database has migrations unknown to this image; refusing downgrade");
    }
    let versions = db.run_pending_migrations(migrations).map_err(|_| anyhow!("migration failed; database retains completed migrations, inspect privately before retrying"))?;
    println!("Applied {} migration(s)", versions.len());
    if applied(db)? != wanted {
        bail!("schema version mismatch after migration");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use diesel::connection::SimpleConnection;
    const FIXTURE: EmbeddedMigrations = diesel_migrations::embed_migrations!("tests/migrations");
    #[test]
    #[ignore = "requires a dedicated SERVICE_HEALTH_TEST_PG database named self_tools_health_test"]
    fn schema_gate_is_read_only_and_migration_is_explicit() {
        let url = std::env::var("SERVICE_HEALTH_TEST_PG").expect("dedicated database required");
        assert!(
            url.split('?')
                .next()
                .unwrap()
                .ends_with("/self_tools_health_test")
        );
        let mut db = PgConnection::establish(&url).expect("test database connection");
        db.batch_execute("DROP TABLE IF EXISTS readiness_fixture; DROP TABLE IF EXISTS __diesel_schema_migrations").unwrap();
        assert!(check(&mut db, FIXTURE).is_err());
        #[derive(QueryableByName)]
        struct Missing {
            #[diesel(sql_type = diesel::sql_types::Bool)]
            missing: bool,
        }
        assert!(
            diesel::sql_query(
                "SELECT to_regclass('__diesel_schema_migrations') IS NULL AS missing"
            )
            .get_result::<Missing>(&mut db)
            .unwrap()
            .missing
        );
        migrate_connection(&mut db, FIXTURE).unwrap();
        check(&mut db, FIXTURE).unwrap();
        migrate_connection(&mut db, FIXTURE).unwrap();
        #[derive(QueryableByName)]
        struct Count {
            #[diesel(sql_type = diesel::sql_types::BigInt)]
            count: i64,
        }
        assert_eq!(
            diesel::sql_query("SELECT count(*) AS count FROM readiness_fixture")
                .get_result::<Count>(&mut db)
                .unwrap()
                .count,
            1
        );
        diesel::sql_query(
            "INSERT INTO __diesel_schema_migrations(version) VALUES ('99999999999999')",
        )
        .execute(&mut db)
        .unwrap();
        assert!(check(&mut db, FIXTURE).is_err());
        assert!(migrate_connection(&mut db, FIXTURE).is_err());
        db.batch_execute("DROP TABLE readiness_fixture; DROP TABLE __diesel_schema_migrations")
            .unwrap();
    }
}
