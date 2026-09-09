mod refresh;
use super::repository as model;
use super::*;
use crate::{errors, graphql, router};
use diesel::{Connection, RunQueryDsl};

use service_errors::UseCaseError;

#[test]
fn schema_matches_browser_contract() {
    assert_eq!(
        graphql::schema_sdl(),
        include_str!("../../../../../web/packages/bookmarks/schema.graphql")
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
        ("query { getNovel(id: 1) { id } }", "INTERNAL"),
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

fn draft(id: &str) -> SaveDraftNovel {
    SaveDraftNovel {
        id: id.into(),
        site: NovelSite::Jjwxc,
        name: "novel".into(),
        description: "private".into(),
        image: "".into(),
        novel_status: NovelStatus::Ongoing,
        author: SaveAuthorInfo {
            id: "author1".into(),
            site: NovelSite::Jjwxc,
            name: "author".into(),
            description: "".into(),
            image: "".into(),
        },
        tags: vec![SaveTagInfo {
            id: "tag1".into(),
            name: "tag".into(),
        }],
        chapters: vec![SaveChapterInfo {
            id: "chapter1".into(),
            name: "chapter".into(),
            time: time::OffsetDateTime::now_utc(),
            word_count: 10,
        }],
    }
}
#[tokio::test]
#[ignore = "requires migrated, dedicated BOOKMARKS_TEST_PG"]
async fn bookmarks_transactions_and_typed_results() {
    let url = std::env::var("BOOKMARKS_TEST_PG").expect("dedicated BOOKMARKS_TEST_PG");
    let pool = model::PgPool::builder()
        .max_size(1)
        .build(diesel::r2d2::ConnectionManager::<diesel::PgConnection>::new(url))
        .unwrap();
    let mut conn = pool.get().unwrap();
    diesel::sql_query("TRUNCATE read_record, novel_comment, collection_novel, chapter, novel, author, tag, collection RESTART IDENTITY").execute(&mut conn).unwrap();
    let first = draft("novel1").save(&mut conn).unwrap();
    let second = draft("novel2").save(&mut conn).unwrap();
    let mut duplicate = draft("novel1");
    duplicate.author.name = "must rollback".into();
    duplicate.tags = vec![SaveTagInfo {
        id: "rollback-tag".into(),
        name: "new".into(),
    }];
    assert!(matches!(
        duplicate.save(&mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    assert_eq!(
        model::author::AuthorModel::get(first.author_id, &mut conn)
            .unwrap()
            .name,
        "author"
    );
    assert_eq!(model::tag::TagModel::get_list(&mut conn).unwrap().len(), 1);
    let chapter = model::chapter::ChapterModel::get_by_novel_id(first.id, &mut conn).unwrap()[0].id;
    let other = model::chapter::ChapterModel::get_by_novel_id(second.id, &mut conn).unwrap()[0].id;
    assert!(matches!(
        Novel::add_read_records(first.id, &[chapter, other], &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Missing(_)))
    ));
    assert!(
        !model::chapter::ChapterModel::get_by_novel_id(first.id, &mut conn).unwrap()[0].is_read
    );
    assert_eq!(
        Novel::add_read_records(first.id, &[chapter, chapter], &mut conn)
            .unwrap()
            .changed_count,
        1
    );
    assert!(matches!(
        Novel::add_read_records(first.id, &[chapter], &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::AlreadyRead(_)))
    ));
    assert_eq!(
        Novel::add_read_records(first.id, &[], &mut conn)
            .unwrap()
            .changed_count,
        0
    );
    assert_eq!(
        Novel::delete_read_records(&[chapter, chapter], &mut conn)
            .unwrap()
            .changed_count,
        1
    );
    assert_eq!(
        Novel::delete_read_records(&[chapter], &mut conn)
            .unwrap()
            .changed_count,
        0
    );
    let parent = Collection::create("parent", None, None, &mut conn).unwrap();
    let child = Collection::create("child", Some(parent.id), None, &mut conn).unwrap();
    assert!(matches!(
        Collection::update(parent.id, "parent", Some(child.id), None, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Validation(_)))
    ));
    Collection::update(parent.id, "new", None, None, &mut conn).unwrap();
    assert_eq!(
        Collection::get(child.id, &mut conn).unwrap().path,
        "/new/child/"
    );
    Novel::add_collection(child.id, first.id, &mut conn).unwrap();
    assert!(matches!(
        Novel::add_collection(child.id, first.id, &mut conn),
        Err(UseCaseError::Rejected(errors::Rejection::Conflict(..)))
    ));
    NovelComment::create(first.id, "private comment", &mut conn).unwrap();
    Novel::add_read_records(first.id, &[chapter], &mut conn).unwrap();
    let rollback: errors::AppResult<()> = conn.transaction(|conn| {
        Author::delete(first.author_id, conn)?;
        Err(errors::missing(errors::ResourceKind::Novel, 99999))
    });
    assert!(rollback.is_err());
    assert!(Novel::get(first.id, &mut conn).is_ok());
    Author::delete(first.author_id, &mut conn).unwrap();
    Author::delete(first.author_id, &mut conn).unwrap();
    assert!(Novel::get(first.id, &mut conn).is_err());
    assert!(Novel::get(second.id, &mut conn).is_err());
    assert!(
        model::chapter::ChapterModel::get_by_novel_id(first.id, &mut conn)
            .unwrap()
            .is_empty()
    );
    Collection::delete(parent.id, &mut conn).unwrap();
    Collection::delete(parent.id, &mut conn).unwrap();
    drop(conn);
    let schema = graphql::get_schema(Application::new(pool.clone(), auth_endpoint()));
    for query in [
        "{getNovel(id:99999){id}}",
        "{queryNovels(pagination:{page:999,pageSize:10}){data{id} total}}",
    ] {
        let response = schema
            .execute(async_graphql::Request::new(query).data(router::Auth))
            .await;
        assert!(response.errors.is_empty(), "{:?}", response.errors);
    }
    let response=schema.execute(async_graphql::Request::new("mutation{createCollection(name: \"/invalid\"){__typename ... on ValidationFailure{issues{path code}}}}").data(router::Auth)).await;
    assert!(response.errors.is_empty());
    assert_eq!(
        response.data.into_json().unwrap()["createCollection"]["__typename"],
        "ValidationFailure"
    );
    refresh::run(pool).await;
}
