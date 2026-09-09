use super::*;
use diesel::connection::SimpleConnection;
use diesel::{
    prelude::*,
    sql_types::{BigInt, Bool, Integer},
};
use std::{
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};

fn connection() -> PgConnection {
    let url = std::env::var("COLLECTIONS_TEST_PG").expect("dedicated test database");
    assert!(
        url.split('?')
            .next()
            .unwrap()
            .ends_with("/self_tools_collections_test")
    );
    PgConnection::establish(&url).unwrap()
}

fn reset(conn: &mut PgConnection) {
    diesel::sql_query("TRUNCATE collection_item, item, collection RESTART IDENTITY")
        .execute(conn)
        .unwrap();
}

fn rename(id: i64, name: &str, conn: &mut PgConnection) -> errors::AppResult<Collection> {
    Collection::update(id, name, None, conn)
}

#[derive(diesel::Queryable, Debug, PartialEq)]
struct CollectionState {
    id: i64,
    name: String,
    path: String,
    parent_id: Option<i64>,
    description: Option<String>,
    update_time: time::OffsetDateTime,
}

fn state(conn: &mut PgConnection) -> Vec<CollectionState> {
    use model::schema::collection::dsl::*;
    collection
        .order(id)
        .select((id, name, path, parent_id, description, update_time))
        .load(conn)
        .unwrap()
}

fn assert_internal<T>(result: errors::AppResult<T>) {
    assert!(
        matches!(result, Err(UseCaseError::Fault(fault)) if fault.public_code() == service_errors::PublicCode::Internal)
    );
}

#[tokio::test]
#[ignore = "requires migrated, dedicated COLLECTIONS_TEST_PG"]
async fn hierarchy_paths_faults_and_atomic_delete() {
    let mut conn = connection();
    reset(&mut conn);
    assert!(matches!(
        Collection::create("missing-parent", Some(999999), None, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Missing(_)))
    ));
    let root = Collection::create("root", None, None, &mut conn).unwrap();
    let child = Collection::create("child", Some(root.id), None, &mut conn).unwrap();
    let leaf = Collection::create("leaf", Some(child.id), None, &mut conn).unwrap();
    let unrelated = Collection::create("other", None, None, &mut conn).unwrap();
    model::collection::CollectionModel::set_path(child.id, "/drift/", &mut conn).unwrap();
    model::collection::CollectionModel::set_path(unrelated.id, "/root/pretend/", &mut conn)
        .unwrap();
    assert!(matches!(
        Collection::create("child", Some(root.id), None, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    let sibling = Collection::create("sibling", Some(root.id), None, &mut conn).unwrap();
    let before = state(&mut conn);
    assert!(matches!(
        rename(sibling.id, "child", &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    assert_eq!(state(&mut conn), before);
    let created = Collection::create("created", Some(child.id), None, &mut conn).unwrap();
    assert_eq!(created.path, "/root/child/created/");

    rename(root.id, "new_%", &mut conn).unwrap();
    assert_eq!(
        Collection::get(child.id, &mut conn).unwrap().path,
        "/new_%/child/"
    );
    assert_eq!(
        Collection::get(leaf.id, &mut conn).unwrap().path,
        "/new_%/child/leaf/"
    );
    assert_eq!(
        Collection::get(unrelated.id, &mut conn).unwrap().path,
        "/root/pretend/"
    );

    // Reuse another affected node's stale path; immediate uniqueness must not reject a valid repair.
    model::collection::CollectionModel::set_path(child.id, "/swapped/", &mut conn).unwrap();
    model::collection::CollectionModel::set_path(root.id, "/swapped/child/", &mut conn).unwrap();
    rename(root.id, "swapped", &mut conn).unwrap();
    assert_eq!(
        Collection::get(child.id, &mut conn).unwrap().path,
        "/swapped/child/"
    );
    model::collection::CollectionModel::set_path(unrelated.id, "/conflict/child/leaf/", &mut conn)
        .unwrap();
    let before = state(&mut conn);
    assert!(matches!(
        rename(root.id, "conflict", &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    assert_eq!(state(&mut conn), before);

    // Force a SQL failure after earlier nodes have changed. All paths and timestamps roll back.
    conn.batch_execute(&format!("CREATE FUNCTION pg_temp.fail_hierarchy_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.id = {} THEN RAISE EXCEPTION 'private hierarchy fixture'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_hierarchy_write BEFORE UPDATE ON collection FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_hierarchy_write();", leaf.id)).unwrap();
    assert_internal(rename(root.id, "failure", &mut conn));
    assert_eq!(state(&mut conn), before);
    conn.batch_execute("DROP TRIGGER test_hierarchy_write ON collection")
        .unwrap();

    // Neither a stored cycle nor a missing ancestor may be repaired by a partial write/delete.
    for parent in [Some(leaf.id), Some(999999)] {
        use model::schema::collection::dsl::*;
        diesel::update(collection.find(root.id))
            .set(parent_id.eq(parent))
            .execute(&mut conn)
            .unwrap();
        let before = state(&mut conn);
        assert_internal(rename(root.id, "broken", &mut conn));
        assert_internal(Collection::create(
            "broken-child",
            Some(root.id),
            None,
            &mut conn,
        ));
        assert_internal(Collection::delete(root.id, &mut conn));
        assert_eq!(state(&mut conn), before);
        Collection::create(
            if parent == Some(leaf.id) {
                "healthy1"
            } else {
                "healthy2"
            },
            None,
            None,
            &mut conn,
        )
        .unwrap();
    }
    // Exercise the actual mutation adapter's safe fault and requestId projection.
    let url = std::env::var("COLLECTIONS_TEST_PG").unwrap();
    let pool = model::PgPool::builder()
        .build(diesel::r2d2::ConnectionManager::<PgConnection>::new(url))
        .unwrap();
    let schema = graphql::get_schema(Application::new(pool, auth_endpoint()));
    let response = schema
        .execute(
            async_graphql::Request::new(format!(
                "mutation {{ deleteCollection(id: {}) {{ __typename }} }}",
                root.id
            ))
            .data(router::Auth),
        )
        .await;
    assert_eq!(response.errors.len(), 1);
    let json = serde_json::to_string(&response).unwrap();
    assert!(json.contains("INTERNAL") && json.contains("requestId"));
    assert!(!json.contains("private") && !json.contains("missing_ancestor"));
    {
        use model::schema::collection::dsl::*;
        diesel::update(collection.find(root.id))
            .set(parent_id.eq(None::<i64>))
            .execute(&mut conn)
            .unwrap();
    }
    // Moderate SQL depth tests deletion order; a pure test covers tens of thousands of nodes.
    let mut last = leaf.id;
    for index in 0..48 {
        last = Collection::create(&format!("d{index}"), Some(last), None, &mut conn)
            .unwrap()
            .id;
    }
    let entity = Item::create("retained".into(), "content".into(), vec![last], &mut conn).unwrap();
    let before = state(&mut conn);
    conn.batch_execute(&format!("CREATE FUNCTION pg_temp.fail_hierarchy_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.id = {} THEN RAISE EXCEPTION 'private delete fixture'; END IF; RETURN OLD; END $$; CREATE TRIGGER test_hierarchy_delete BEFORE DELETE ON collection FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_hierarchy_delete();", root.id)).unwrap();
    assert_internal(Collection::delete(root.id, &mut conn));
    assert_eq!(state(&mut conn), before);
    assert!(
        !model::read::item_collections(&[entity.id], &mut conn).unwrap()[&entity.id].is_empty()
    );
    conn.batch_execute("DROP TRIGGER test_hierarchy_delete ON collection")
        .unwrap();
    Collection::delete(root.id, &mut conn).unwrap();
    Collection::delete(root.id, &mut conn).unwrap();
    assert!(Collection::get(last, &mut conn).is_err());
    assert!(Collection::get(unrelated.id, &mut conn).is_ok());
    assert!(Item::get(entity.id, &mut conn).is_ok());
    assert!(model::read::item_collections(&[entity.id], &mut conn).unwrap()[&entity.id].is_empty());
}

// Keep the first operation's transaction open until the second connection is demonstrably
// waiting on a database lock. No sleeps or scheduler-dependent success assumptions.
fn ordered_race(
    conn: &mut PgConnection,
    first: impl FnOnce(&mut PgConnection) -> errors::AppResult<i64>,
    second: impl FnOnce(&mut PgConnection) -> errors::AppResult<i64> + Send + 'static,
) -> errors::AppResult<i64> {
    #[derive(QueryableByName)]
    struct Pid {
        #[diesel(sql_type = Integer)]
        pid: i32,
    }
    #[derive(QueryableByName)]
    struct Waiting {
        #[diesel(sql_type = Bool)]
        waiting: bool,
    }
    let (send, receive) = mpsc::channel();
    let handle = conn.transaction::<_, errors::AppError, _>(|conn| {
        first(conn)?;
        let handle = thread::spawn(move || {
            let mut conn = connection();
            conn.batch_execute("SET lock_timeout = '10s'; SET statement_timeout = '15s'").unwrap();
            let pid = diesel::sql_query("SELECT pg_backend_pid() AS pid").get_result::<Pid>(&mut conn).unwrap().pid;
            send.send(pid).unwrap();
            second(&mut conn)
        });
        let pid = receive.recv_timeout(Duration::from_secs(5)).unwrap();
        let deadline = Instant::now() + Duration::from_secs(5);
        loop {
            let waiting = diesel::sql_query("SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid = $1 AND NOT granted) AS waiting")
                .bind::<Integer, _>(pid).get_result::<Waiting>(conn).unwrap().waiting;
            if waiting { break; }
            assert!(Instant::now() < deadline, "second writer did not reach the lock");
            thread::yield_now();
        }
        Ok(handle)
    }).unwrap();
    handle.join().unwrap()
}

#[test]
#[ignore = "requires migrated, dedicated COLLECTIONS_TEST_PG"]
fn hierarchy_concurrent_writers_preserve_topology() {
    let mut conn = connection();
    reset(&mut conn);
    let root = Collection::create("root", None, None, &mut conn)
        .unwrap()
        .id;
    assert!(matches!(
        ordered_race(
            &mut conn,
            |conn| Collection::delete(root, conn),
            move |conn| Collection::create("child", Some(root), None, conn).map(|c| c.id)
        ),
        Err(UseCaseError::Rejected(errors::Rejection::Missing(_)))
    ));
    let root = Collection::create("root", None, None, &mut conn)
        .unwrap()
        .id;
    ordered_race(
        &mut conn,
        |conn| Collection::create("child", Some(root), None, conn).map(|c| c.id),
        move |conn| Collection::delete(root, conn),
    )
    .unwrap();
    assert!(state(&mut conn).is_empty());
    let root = Collection::create("root", None, None, &mut conn)
        .unwrap()
        .id;
    let child = ordered_race(
        &mut conn,
        |conn| rename(root, "renamed", conn).map(|c| c.id),
        move |conn| Collection::create("child", Some(root), None, conn).map(|c| c.id),
    )
    .unwrap();
    assert_eq!(
        Collection::get(child, &mut conn).unwrap().path,
        "/renamed/child/"
    );
    ordered_race(
        &mut conn,
        |conn| Collection::create("second", Some(child), None, conn).map(|c| c.id),
        move |conn| rename(root, "again", conn).map(|c| c.id),
    )
    .unwrap();
    assert!(
        state(&mut conn)
            .iter()
            .all(|row| row.path.starts_with("/again/"))
    );

    #[derive(QueryableByName)]
    struct Count {
        #[diesel(sql_type = BigInt)]
        count: i64,
    }
    let orphans = diesel::sql_query("SELECT count(*) AS count FROM collection c LEFT JOIN collection p ON c.parent_id = p.id WHERE c.parent_id IS NOT NULL AND p.id IS NULL").get_result::<Count>(&mut conn).unwrap();
    assert_eq!(orphans.count, 0);
}
