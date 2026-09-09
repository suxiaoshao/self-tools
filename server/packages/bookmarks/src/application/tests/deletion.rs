use super::*;
use diesel::{connection::SimpleConnection, prelude::*, sql_types::BigInt};

fn counts(conn: &mut PgConnection) -> Vec<i64> {
    #[derive(QueryableByName)]
    struct Count {
        #[diesel(sql_type = BigInt)]
        count: i64,
    }
    [
        "read_record",
        "novel_comment",
        "collection_novel",
        "chapter",
        "novel",
        "author",
        "tag",
        "collection",
    ]
    .iter()
    .map(|table| {
        diesel::sql_query(format!("SELECT count(*) AS count FROM {table}"))
            .get_result::<Count>(conn)
            .unwrap()
            .count
    })
    .collect()
}

#[test]
#[ignore = "requires migrated, dedicated BOOKMARKS_TEST_PG"]
fn novel_delete_preserves_shared_entities_and_rolls_back_failures() {
    let url = std::env::var("BOOKMARKS_TEST_PG").unwrap();
    assert!(
        url.split('?')
            .next()
            .unwrap()
            .ends_with("/self_tools_bookmarks_test")
    );
    let mut conn = PgConnection::establish(&url).unwrap();
    conn.batch_execute("TRUNCATE read_record, novel_comment, collection_novel, chapter, novel, author, tag, collection RESTART IDENTITY").unwrap();
    let first = draft("first").save(&mut conn).unwrap();
    let second = draft("second").save(&mut conn).unwrap();
    let collection = Collection::create("shared", None, None, &mut conn).unwrap();
    for novel in [&first, &second] {
        Novel::add_collection(collection.id, novel.id, &mut conn).unwrap();
        NovelComment::create(novel.id, "fixture comment", &mut conn).unwrap();
        let chapter =
            model::chapter::ChapterModel::get_by_novel_id(novel.id, &mut conn).unwrap()[0].id;
        Novel::add_read_records(novel.id, &[chapter], &mut conn).unwrap();
    }
    let before = counts(&mut conn);
    assert_eq!(before, vec![2, 2, 2, 2, 2, 1, 1, 1]);
    conn.batch_execute("CREATE FUNCTION pg_temp.fail_novel_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private deletion failure'; END $$; CREATE TRIGGER test_novel_delete BEFORE DELETE ON novel FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_novel_delete();").unwrap();
    assert!(matches!(
        Novel::delete(first.id, &mut conn),
        Err(UseCaseError::Fault(_))
    ));
    assert_eq!(counts(&mut conn), before);
    conn.batch_execute("DROP TRIGGER test_novel_delete ON novel")
        .unwrap();
    Novel::delete(first.id, &mut conn).unwrap();
    Novel::delete(first.id, &mut conn).unwrap();
    assert_eq!(counts(&mut conn), vec![1, 1, 1, 1, 1, 1, 1, 1]);
    assert!(Novel::get(first.id, &mut conn).is_err());
    assert!(Novel::get(second.id, &mut conn).is_ok());
    assert!(model::author::AuthorModel::get(first.author_id, &mut conn).is_ok());
    assert!(
        model::collection_novel::CollectionNovelModel::exists(collection.id, second.id, &mut conn)
            .unwrap()
    );
}
