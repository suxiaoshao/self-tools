use super::*;
use std::{
    collections::HashMap,
    future::Future,
    pin::Pin,
    sync::{
        Mutex,
        atomic::{AtomicBool, AtomicUsize, Ordering},
    },
};
use tokio::{
    sync::Notify,
    time::{Duration, timeout},
};

struct FixedCrawler {
    author: Mutex<DraftAuthor>,
    novels: Mutex<HashMap<String, DraftNovel>>,
    author_calls: AtomicUsize,
    novel_calls: AtomicUsize,
    pause: AtomicBool,
    fail: AtomicBool,
    entered: Notify,
    resume: Notify,
}
impl crawler::Crawler for FixedCrawler {
    fn author(
        &self,
        _: NovelSite,
        _: String,
    ) -> Pin<Box<dyn Future<Output = AppResult<DraftAuthor>> + Send + '_>> {
        Box::pin(async move {
            self.author_calls.fetch_add(1, Ordering::SeqCst);
            Ok(self.author.lock().unwrap().clone())
        })
    }
    fn novel(
        &self,
        _: NovelSite,
        id: String,
    ) -> Pin<Box<dyn Future<Output = AppResult<DraftNovel>> + Send + '_>> {
        Box::pin(async move {
            self.novel_calls.fetch_add(1, Ordering::SeqCst);
            if self.pause.swap(false, Ordering::SeqCst) {
                self.entered.notify_one();
                self.resume.notified().await;
            }
            if self.fail.load(Ordering::SeqCst) {
                return Err(service_errors::Fault::new(
                    service_errors::FaultKind::Network,
                    "test_fetch",
                    std::io::Error::other("unavailable"),
                )
                .into());
            }
            Ok(self.novels.lock().unwrap().get(&id).unwrap().clone())
        })
    }
}

pub(super) async fn run(pool: PgPool) {
    assert_eq!(pool.max_size(), 1);
    let mut input = draft("101");
    input.author.id = "201".into();
    input.chapters[0].id = "301".into();
    let old_time = input.chapters[0].time;
    let fetched = DraftNovel {
        id: "101".into(),
        site: NovelSite::Jjwxc,
        url: "https://example.invalid/101".into(),
        name: "refreshed".into(),
        description: "new description".into(),
        image: String::new(),
        status: NovelStatus::Paused,
        author_id: "201".into(),
        chapters: vec![
            DraftChapter {
                id: "301".into(),
                novel_id: "101".into(),
                site: NovelSite::Jjwxc,
                url: String::new(),
                title: "updated chapter".into(),
                time: old_time,
                word_count: 20,
            },
            DraftChapter {
                id: "302".into(),
                novel_id: "101".into(),
                site: NovelSite::Jjwxc,
                url: String::new(),
                title: "new chapter".into(),
                time: old_time + time::Duration::seconds(1),
                word_count: 30,
            },
        ],
        tags: vec![DraftTag {
            id: "1".into(),
            name: "tag".into(),
            url: String::new(),
        }],
    };
    let crawler = Arc::new(FixedCrawler {
        author: Mutex::new(DraftAuthor {
            id: "201".into(),
            site: NovelSite::Jjwxc,
            url: String::new(),
            name: "fetched author".into(),
            description: String::new(),
            image: String::new(),
            novel_ids: vec!["101".into()],
        }),
        novels: Mutex::new(HashMap::from([("101".into(), fetched.clone())])),
        author_calls: AtomicUsize::new(0),
        novel_calls: AtomicUsize::new(0),
        pause: AtomicBool::new(false),
        fail: AtomicBool::new(false),
        entered: Notify::new(),
        resume: Notify::new(),
    });
    let app = Arc::new(Application {
        database: Database::new(pool.clone()),
        auth: auth_endpoint(),
        crawler: crawler.clone(),
    });
    assert!(app.database_ready().await);
    app.database
        .run("test_schema_mismatch", |c| -> AppResult<()> {
            diesel::sql_query(
                "INSERT INTO __diesel_schema_migrations (version) VALUES ('issue99-test-mismatch')",
            )
            .execute(c)?;
            Ok(())
        })
        .await
        .unwrap();
    let mismatched_ready = app.database_ready().await;
    app.database
        .run("restore_test_schema", |c| -> AppResult<()> {
            diesel::sql_query(
                "DELETE FROM __diesel_schema_migrations WHERE version='issue99-test-mismatch'",
            )
            .execute(c)?;
            Ok(())
        })
        .await
        .unwrap();
    assert!(!mismatched_ready);
    assert!(app.database_ready().await);
    let novel = app.save_draft_novel(input).await.unwrap();
    let original = app
        .batch_chapters(vec![novel.id])
        .await
        .unwrap()
        .remove(&novel.id)
        .unwrap_or_default()
        .remove(0);
    app.add_read_records_for_chapter(novel.id, vec![original.id])
        .await
        .unwrap();
    let schema = graphql::get_schema(app.clone());
    // Metadata selection must not fetch the author's novels or a novel's author.
    let response = schema
        .execute(
            async_graphql::Request::new("{fetchAuthor(id:\"201\",novelSite:JJWXC){id name}}")
                .data(router::Auth),
        )
        .await;
    assert!(response.errors.is_empty(), "{:?}", response.errors);
    assert_eq!(crawler.author_calls.load(Ordering::SeqCst), 1);
    assert_eq!(crawler.novel_calls.load(Ordering::SeqCst), 0);
    let response=schema.execute(async_graphql::Request::new("{fetchNovel(id:\"101\",novelSite:JJWXC){id status chapters{id title} tags{id name}}}").data(router::Auth)).await;
    assert!(response.errors.is_empty(), "{:?}", response.errors);
    assert_eq!(crawler.author_calls.load(Ordering::SeqCst), 1);
    assert_eq!(crawler.novel_calls.load(Ordering::SeqCst), 1);
    let response = schema
        .execute(
            async_graphql::Request::new(
                "{fetchAuthor(id:\"201\",novelSite:JJWXC){novels{id author{id}}}}",
            )
            .data(router::Auth),
        )
        .await;
    assert!(response.errors.is_empty(), "{:?}", response.errors);
    assert_eq!(crawler.author_calls.load(Ordering::SeqCst), 3);
    assert_eq!(crawler.novel_calls.load(Ordering::SeqCst), 2);

    crawler.pause.store(true, Ordering::SeqCst);
    let refreshing = tokio::spawn({
        let app = app.clone();
        async move { app.refresh_novel(novel.id).await }
    });
    timeout(Duration::from_secs(2), crawler.entered.notified())
        .await
        .unwrap();
    // The only DB slot is available while network work is suspended.
    timeout(Duration::from_secs(2), app.all_tags())
        .await
        .unwrap()
        .unwrap();
    crawler.resume.notify_one();
    let refreshed = timeout(Duration::from_secs(2), refreshing)
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    assert_eq!(refreshed.name, "refreshed");
    assert_eq!(refreshed.novel_status, NovelStatus::Paused);
    let chapters = app
        .batch_chapters(vec![novel.id])
        .await
        .unwrap()
        .remove(&novel.id)
        .unwrap_or_default();
    assert_eq!(chapters.len(), 2);
    assert_eq!(chapters[0].id, original.id);
    assert!(chapters[0].is_read);
    assert_eq!(chapters[0].word_count, 20);

    // A write failure after updating the novel rolls back metadata and chapter changes.
    {
        let mut values = crawler.novels.lock().unwrap();
        let snapshot = values.get_mut("101").unwrap();
        snapshot.name = "must rollback".into();
        snapshot.chapters[1].title = "x".repeat(256);
    }
    assert!(app.refresh_novel(novel.id).await.is_err());
    assert_eq!(
        app.batch_novels(vec![novel.id])
            .await
            .unwrap()
            .remove(&novel.id)
            .unwrap()
            .name,
        "refreshed"
    );
    assert_eq!(
        app.batch_chapters(vec![novel.id])
            .await
            .unwrap()
            .remove(&novel.id)
            .unwrap_or_default()[1]
            .title,
        "new chapter"
    );
    crawler
        .novels
        .lock()
        .unwrap()
        .insert("101".into(), fetched.clone());
    crawler.fail.store(true, Ordering::SeqCst);
    assert!(app.refresh_novel(novel.id).await.is_err());
    crawler.fail.store(false, Ordering::SeqCst);
    assert_eq!(
        app.batch_novels(vec![novel.id])
            .await
            .unwrap()
            .remove(&novel.id)
            .unwrap()
            .name,
        "refreshed"
    );
    crawler
        .novels
        .lock()
        .unwrap()
        .get_mut("101")
        .unwrap()
        .chapters[0]
        .novel_id = "wrong".into();
    assert!(app.refresh_novel(novel.id).await.is_err());
    crawler
        .novels
        .lock()
        .unwrap()
        .get_mut("101")
        .unwrap()
        .chapters
        .clear();
    assert!(app.refresh_novel(novel.id).await.is_err());
    assert_eq!(
        app.batch_chapters(vec![novel.id])
            .await
            .unwrap()
            .remove(&novel.id)
            .unwrap_or_default()
            .len(),
        2
    );
    crawler
        .novels
        .lock()
        .unwrap()
        .insert("101".into(), fetched.clone());

    // Parent refresh protects an empty listing, then removes obsolete novels atomically.
    crawler.author.lock().unwrap().novel_ids.clear();
    assert!(app.refresh_author(novel.author_id).await.is_err());
    assert_eq!(
        app.batch_authors(vec![novel.author_id])
            .await
            .unwrap()
            .remove(&novel.author_id)
            .unwrap()
            .name,
        "author"
    );
    crawler.author.lock().unwrap().novel_ids = vec!["101".into()];
    let mut obsolete = draft("102");
    obsolete.author.id = "201".into();
    let obsolete = app.save_draft_novel(obsolete).await.unwrap();
    let obsolete_chapters = app
        .batch_chapters(vec![obsolete.id])
        .await
        .unwrap()
        .remove(&obsolete.id)
        .unwrap_or_default();
    app.add_read_records_for_chapter(obsolete.id, vec![obsolete_chapters[0].id])
        .await
        .unwrap();
    app.add_comment_for_novel(obsolete.id, "obsolete".into())
        .await
        .unwrap();
    let collection = app
        .create_collection("refresh collection".into(), None, None)
        .await
        .unwrap();
    app.add_collection_for_novel(collection.id, obsolete.id)
        .await
        .unwrap();
    app.refresh_author(novel.author_id).await.unwrap();
    assert!(
        app.batch_novels(vec![obsolete.id])
            .await
            .unwrap()
            .remove(&obsolete.id)
            .is_none()
    );
    assert!(
        app.batch_chapters(vec![obsolete.id])
            .await
            .unwrap()
            .remove(&obsolete.id)
            .unwrap_or_default()
            .is_empty()
    );
    assert!(
        app.batch_novel_comments(vec![obsolete.id])
            .await
            .unwrap()
            .remove(&obsolete.id)
            .is_none()
    );
    assert!(
        app.batch_novel_collections(vec![obsolete.id])
            .await
            .unwrap()
            .remove(&obsolete.id)
            .unwrap_or_default()
            .is_empty()
    );
    // A valid transport mutation and nested resolvers use the injected application.
    let response=schema.execute(async_graphql::Request::new("mutation{createTag(name:\"甜\",site:JJWXC,siteId:\"test-tag\"){__typename ... on TagSaved{tagId}}}").data(router::Auth)).await;
    assert!(response.errors.is_empty(), "{:?}", response.errors);
    assert_eq!(
        response.data.into_json().unwrap()["createTag"]["__typename"],
        "TagSaved"
    );
    let response=schema.execute(async_graphql::Request::new(format!("{{getNovel(id:{}){{id author{{id name novels{{id}}}} chapters{{id isRead author{{id}} novel{{id}}}} wordCount readPercentage tags{{id}} firstChapter{{id}} lastChapter{{id}}}}}}",novel.id)).data(router::Auth)).await;
    assert!(response.errors.is_empty(), "{:?}", response.errors);
    let data = response.data.into_json().unwrap();
    assert_eq!(data["getNovel"]["author"]["name"], "fetched author");
    assert_eq!(data["getNovel"]["chapters"].as_array().unwrap().len(), 2);
    assert_eq!(data["getNovel"]["chapters"][0]["isRead"], true);
}
