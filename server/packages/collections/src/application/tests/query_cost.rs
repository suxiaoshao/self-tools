use super::*;
use diesel::connection::InstrumentationEvent;
use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};
#[derive(Debug)]
struct Counter(Arc<AtomicUsize>);
impl diesel::r2d2::CustomizeConnection<diesel::PgConnection, diesel::r2d2::Error> for Counter {
    fn on_acquire(&self, conn: &mut diesel::PgConnection) -> Result<(), diesel::r2d2::Error> {
        let count = self.0.clone();
        conn.set_instrumentation(move |event: InstrumentationEvent<'_>| {
            if let InstrumentationEvent::StartQuery { query, .. } = event {
                let sql = query.to_string();
                let sql = sql.trim_start();
                if sql.starts_with("SELECT") || sql.starts_with("WITH") {
                    count.fetch_add(1, Ordering::SeqCst);
                }
            }
        });
        Ok(())
    }
}
fn filter(ids: &[i64], full_match: bool) -> Option<TagFilter> {
    Some(TagFilter {
        match_set: ids.iter().copied().collect(),
        full_match,
    })
}
#[tokio::test]
#[ignore = "requires migrated dedicated TEST_PG; truncates only the named test database"]
async fn sql_pagination_batching_and_cost_contract() {
    let url = std::env::var("COLLECTIONS_TEST_PG").unwrap();
    assert!(
        url.split('?')
            .next()
            .unwrap()
            .ends_with("/self_tools_collections_test")
    );
    let count = Arc::new(AtomicUsize::new(0));
    let pool = model::PgPool::builder()
        .max_size(1)
        .test_on_check_out(false)
        .connection_customizer(Box::new(Counter(count.clone())))
        .build(diesel::r2d2::ConnectionManager::new(url.clone()))
        .unwrap();
    let mut c = pool.get().unwrap();
    diesel::sql_query("TRUNCATE collection_item, item, collection RESTART IDENTITY")
        .execute(&mut c)
        .unwrap();
    let a = Collection::create("a", None, None, &mut c).unwrap();
    let b = Collection::create("b", None, None, &mut c).unwrap();
    let z = Collection::create("z", None, None, &mut c).unwrap();
    let child = Collection::create("child", Some(a.id), None, &mut c).unwrap();
    let mut ids = vec![];
    for i in 0..101 {
        ids.push(
            Item::create(format!("item{i}"), "x".repeat(64 * 1024), vec![], &mut c)
                .unwrap()
                .id,
        );
    }
    Item::add_collection(child.id, ids[0], &mut c).unwrap();
    Item::add_collection(b.id, ids[0], &mut c).unwrap();
    Item::add_collection(z.id, ids[1], &mut c).unwrap();
    drop(c);
    let app = Application::new(pool.clone(), auth_endpoint());
    count.store(0, Ordering::SeqCst);
    let (first, total) = app
        .query_items(None, PageRange::new(1, 20).unwrap())
        .await
        .unwrap();
    assert_eq!(total, 101);
    assert_eq!(first.iter().map(|x| x.id).collect::<Vec<_>>(), ids[..20]);
    assert_eq!(count.load(Ordering::SeqCst), 2);
    let (last, total) = app
        .query_items(None, PageRange::new(6, 20).unwrap())
        .await
        .unwrap();
    assert_eq!(total, 101);
    assert_eq!(last[0].id, ids[100]);
    assert_eq!(last.len(), 1);
    assert!(
        app.query_items(None, PageRange::new(99, 20).unwrap())
            .await
            .unwrap()
            .0
            .is_empty()
    );
    assert!(
        app.query_items(
            filter(&[a.id, b.id, z.id], true),
            PageRange::new(1, 20).unwrap()
        )
        .await
        .unwrap()
        .0
        .is_empty()
    );
    count.store(0, Ordering::SeqCst);
    let (matched, total) = app
        .query_items(
            filter(&[a.id, child.id, b.id], true),
            PageRange::new(1, 20).unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(total, 1);
    assert_eq!(matched[0].id, ids[0]);
    assert_eq!(count.load(Ordering::SeqCst), 3);
    let (matched, total) = app
        .query_items(filter(&[a.id, z.id], false), PageRange::new(1, 20).unwrap())
        .await
        .unwrap();
    assert_eq!(total, 2);
    assert_eq!(matched.len(), 2);
    assert!(
        app.query_items(filter(&[99999], true), PageRange::new(1, 20).unwrap())
            .await
            .is_err()
    );
    let schema = graphql::get_schema(app.clone());
    for size in [5, 20, 100] {
        count.store(0, Ordering::SeqCst);
        let query = format!(
            "{{queryItems(pagination:{{page:1,pageSize:{size}}}){{data{{id collections{{id}}}} total}}}}"
        );
        let response = schema
            .execute(async_graphql::Request::new(query).data(router::Auth))
            .await;
        assert!(response.errors.is_empty(), "{:?}", response.errors);
        assert_eq!(count.load(Ordering::SeqCst), 3);
    }
    count.store(0, Ordering::SeqCst);
    let batch = app
        .batch_item_collections((1..=501).collect())
        .await
        .unwrap();
    assert_eq!(count.load(Ordering::SeqCst), 2);
    assert_eq!(batch.len(), 501);
    let response=schema.execute(async_graphql::Request::new("{queryItems(pagination:{page:1,pageSize:20}){data{id name createTime updateTime} total}}").data(router::Auth)).await;
    assert!(response.errors.is_empty());
    let json = serde_json::to_string(&response).unwrap();
    assert!(json.len() < 16384);
    assert!(!json.contains("content"));
    let response = schema
        .execute(
            async_graphql::Request::new(format!("{{getItem(id:{}){{content}}}}", ids[0]))
                .data(router::Auth),
        )
        .await;
    assert_eq!(
        response.data.into_json().unwrap()["getItem"]["content"]
            .as_str()
            .unwrap()
            .len(),
        64 * 1024
    );
    let response = schema.execute("{ private-invalid").await;
    assert_eq!(response.errors[0].message, "INVALID_REQUEST");
    // Batch ancestry keeps missing/cyclic keys separate from a valid key.
    let mut c = pool.get().unwrap();
    diesel::sql_query("UPDATE collection SET parent_id=id WHERE id=3")
        .execute(&mut c)
        .unwrap();
    drop(c);
    let paths = app
        .batch_ancestors(vec![child.id, z.id, 99999])
        .await
        .unwrap();
    assert!(matches!(&paths[&child.id],read::Ancestry::Found(v) if v.len()==1&&v[0].id==a.id));
    assert!(matches!(paths[&z.id], read::Ancestry::Cycle));
    assert!(matches!(paths[&99999], read::Ancestry::Missing(99999)));
    // Recursive filtering terminates on the same dirty cycle without changing data.
    let (_, total) = app
        .query_items(filter(&[z.id], false), PageRange::new(1, 20).unwrap())
        .await
        .unwrap();
    assert_eq!(total, 1);
    count.store(0, Ordering::SeqCst);
    let denied = format!(
        "{{{}}}",
        (0..21)
            .map(|i| format!("a{i}:allCollections{{id}} "))
            .collect::<String>()
    );
    let response = schema
        .execute(async_graphql::Request::new(denied).data(router::Auth))
        .await;
    assert!(!response.errors.is_empty());
    assert_eq!(count.load(Ordering::SeqCst), 0);
    // A writer commits between count and page; both results still use the original snapshot.
    let (counted_tx, counted_rx) = std::sync::mpsc::channel();
    let (written_tx, written_rx) = std::sync::mpsc::channel();
    let mut signal = Some((counted_tx, written_rx));
    let mut c = pool.get().unwrap();
    c.set_instrumentation(move |event: InstrumentationEvent<'_>| {
        if let InstrumentationEvent::FinishQuery { query, .. } = event
            && query.to_string().contains("AS total FROM matching")
            && let Some((tx, rx)) = signal.take()
        {
            tx.send(()).unwrap();
            rx.recv_timeout(std::time::Duration::from_secs(5)).unwrap();
        }
    });
    drop(c);
    let writer = std::thread::spawn(move || {
        counted_rx
            .recv_timeout(std::time::Duration::from_secs(5))
            .unwrap();
        let mut conn = diesel::PgConnection::establish(&url).unwrap();
        Item::create("concurrent".into(), "concurrent".into(), vec![], &mut conn).unwrap();
        written_tx.send(()).unwrap();
    });
    let (data, total) = app
        .query_items(None, PageRange::new(2, 100).unwrap())
        .await
        .unwrap();
    writer.join().unwrap();
    assert_eq!(total, 101);
    assert_eq!(data.len(), 1);
    assert_eq!(data[0].id, ids[100]);
}
