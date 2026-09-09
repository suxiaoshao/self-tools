mod hierarchy;
use super::repository as model;
use super::*;
use super::{collection::Collection, item::Item};
use crate::{errors, graphql, router};
use diesel::{Connection, RunQueryDsl};
use service_errors::UseCaseError;

#[test]
fn schema_matches_browser_contract() {
    assert_eq!(
        graphql::schema_sdl(),
        include_str!("../../../../../web/packages/collections/schema.graphql")
    );
}

#[tokio::test]
async fn graphql_framework_and_fault_outputs_are_safe() {
    let schema = async_graphql::Schema::build(
        graphql::query::QueryRoot,
        graphql::mutation::MutationRoot,
        async_graphql::EmptySubscription,
    )
    .extension(middleware::Logger)
    .finish();
    for (query, code) in [
        ("query { secretToken }", "INVALID_REQUEST"),
        ("query { getItem(id: 1) { id } }", "INTERNAL"),
        (
            "query { collectionAndItem(query: {createTime:{start:\"secret-token\",end:\"also-secret\"},pagination:{page:1,pageSize:10}}) { total } }",
            "INVALID_REQUEST",
        ),
    ] {
        let response = schema
            .execute(async_graphql::Request::new(query).data(router::Auth))
            .await;
        assert!(!response.errors.is_empty());
        assert_eq!(
            response.errors[0].extensions.as_ref().unwrap().get("code"),
            Some(&async_graphql::Value::String(code.into()))
        );
        let json = serde_json::to_string(&response).unwrap();
        assert!(!json.contains("secret"), "{json}");
        assert!(!json.contains("source"));
        assert!(json.contains("requestId"));
    }
}

#[tokio::test]
#[ignore = "requires migrated, dedicated COLLECTIONS_TEST_PG"]
async fn collections_transactions_and_typed_results() {
    let url = std::env::var("COLLECTIONS_TEST_PG").expect("dedicated COLLECTIONS_TEST_PG");
    let pool = model::PgPool::builder()
        .build(diesel::r2d2::ConnectionManager::<diesel::PgConnection>::new(url))
        .unwrap();
    let mut conn = pool.get().unwrap();
    diesel::sql_query("TRUNCATE collection_item, item, collection RESTART IDENTITY")
        .execute(&mut conn)
        .unwrap();
    let parent = Collection::create("parent", None, None, &mut conn).unwrap();
    let child = Collection::create("child", Some(parent.id), None, &mut conn).unwrap();
    Collection::update(parent.id, "renamed", None, &mut conn).unwrap();
    assert_eq!(
        Collection::get(child.id, &mut conn).unwrap().path,
        "/renamed/child/"
    );
    assert!(matches!(
        Collection::create("renamed", None, None, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    assert!(matches!(
        Collection::update(parent.id, "/invalid", None, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Validation(..)))
    ));
    let item = Item::create(
        "item".into(),
        "private".into(),
        vec![child.id, child.id],
        &mut conn,
    )
    .unwrap();
    assert_eq!(
        model::read::item_collections(&[item.id], &mut conn).unwrap()[&item.id].len(),
        1
    );
    assert!(matches!(
        Item::create(
            "missing".into(),
            "private".into(),
            vec![child.id, 99999],
            &mut conn
        ),
        Err(UseCaseError::Rejected(errors::Rejection::Missing(_)))
    ));
    assert_eq!(model::item::ItemModel::all(&mut conn).unwrap().len(), 1);
    let rollback: errors::AppResult<()> = conn.transaction(|conn| {
        Item::create("rollback".into(), "private".into(), vec![child.id], conn)?;
        Err(errors::missing(errors::ResourceKind::Collection, 99999))
    });
    assert!(rollback.is_err());
    assert_eq!(model::item::ItemModel::all(&mut conn).unwrap().len(), 1);
    assert!(matches!(
        Item::add_collection(child.id, item.id, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    Item::delete_collection(99999, item.id, &mut conn).unwrap();
    Collection::delete(parent.id, &mut conn).unwrap();
    Collection::delete(parent.id, &mut conn).unwrap();
    assert!(
        model::read::item_collections(&[item.id], &mut conn)
            .unwrap()
            .remove(&item.id)
            .unwrap()
            .is_empty()
    );
    assert!(Collection::get(child.id, &mut conn).is_err());
    Item::delete(item.id, &mut conn).unwrap();
    Item::delete(item.id, &mut conn).unwrap();
    drop(conn);
    let application = Application::new(pool, auth_endpoint());
    let schema = graphql::get_schema(application.clone());
    for query in [
        "{ getItem(id: 99999) { id } }",
        "{ queryItems(pagination:{page:999,pageSize:10}) { data { id } total } }",
        "{ collectionAndItem(query:{pagination:{page:999,pageSize:10}}) {data {__typename} total} }",
    ] {
        let response = schema
            .execute(async_graphql::Request::new(query).data(router::Auth))
            .await;
        assert!(response.errors.is_empty(), "{:?}", response.errors);
    }
    let response=schema.execute(async_graphql::Request::new("mutation { createCollection(name: \"/invalid\") { __typename ... on ValidationFailure {issues {path code}} } }").data(router::Auth)).await;
    assert!(response.errors.is_empty());
    assert_eq!(
        response.data.into_json().unwrap()["createCollection"]["__typename"],
        "ValidationFailure"
    );

    let parent = application
        .create_collection("mixed".into(), None, None)
        .await
        .unwrap();
    for index in 0..3 {
        application
            .create_collection(format!("child-{index}"), Some(parent.id), None)
            .await
            .unwrap();
    }
    for index in 0..4 {
        let request = format!(
            "mutation {{ createItem(name: \"item-{index}\", content: \"fixture\", collectionIds: [{}]) {{ __typename ... on ItemSaved {{itemId}} }} }}",
            parent.id
        );
        let response = schema
            .execute(async_graphql::Request::new(request).data(router::Auth))
            .await;
        assert!(response.errors.is_empty(), "{:?}", response.errors);
        assert_eq!(
            response.data.into_json().unwrap()["createItem"]["__typename"],
            "ItemSaved"
        );
    }
    for (page, expected) in [
        (
            1,
            vec!["Collection", "Collection", "Collection", "Item", "Item"],
        ),
        (2, vec!["Item", "Item"]),
    ] {
        let request = format!(
            "{{ collectionAndItem(query: {{id: {}, pagination: {{page: {page}, pageSize: 5}}}}) {{total data {{__typename ... on Collection {{ancestors {{id}}}} ... on Item {{collections {{id}}}} }} }} }}",
            parent.id
        );
        let response = schema
            .execute(async_graphql::Request::new(request).data(router::Auth))
            .await;
        assert!(response.errors.is_empty(), "{:?}", response.errors);
        let value = response.data.into_json().unwrap();
        let result = &value["collectionAndItem"];
        assert_eq!(result["total"], 7);
        assert_eq!(
            result["data"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v["__typename"].as_str().unwrap())
                .collect::<Vec<_>>(),
            expected
        );
    }
}

mod browser_operations {
    include!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../common/graphql-common/test-support/browser_operations.rs"
    ));
}

mod query_cost;
