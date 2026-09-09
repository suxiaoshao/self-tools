//! Refresh orchestration releases the database executor before any external work.
use super::{
    Application, Author, DraftChapter, DraftNovel, Novel,
    repository::{
        author::UpdateAuthorModel,
        chapter::{ChapterModel, NewChapter, UpdateChapterModel},
        novel::{NewNovel, NovelModel, UpdateNovelModel},
        read_record::ReadRecordModel,
    },
};
use crate::errors::*;
use diesel::PgConnection;
use std::collections::{HashMap, HashSet};
use time::OffsetDateTime;

impl Application {
    pub(crate) async fn refresh_novel(&self, id: i64) -> AppResult<Novel> {
        validate_id(id, "novelId")?;
        let source = self
            .database
            .run("refresh_novel_source", move |c| Novel::get(id, c))
            .await?;
        let fetched = self
            .crawler
            .novel(source.site, source.site_id.clone())
            .await?;
        if fetched.id != source.site_id || fetched.site != source.site {
            return Err(protocol("crawler_identity"));
        }
        validate_chapters(&fetched)?;
        self.database
            .run("refresh_novel_write", move |c| {
                super::write(c, |c| {
                    let current = Novel::get(id, c)?;
                    let novel = update_novel(current.id, &fetched, c)?;
                    sync_chapters(&novel, &fetched.chapters, c)?;
                    Ok(novel.into())
                })
                .map_err(source_conflict)
            })
            .await
    }
    pub(crate) async fn refresh_author(&self, id: i64) -> AppResult<Author> {
        validate_id(id, "authorId")?;
        let source = self
            .database
            .run("refresh_author_source", move |c| Author::get(id, c))
            .await?;
        let fetched = self
            .crawler
            .author(source.site, source.site_id.clone())
            .await?;
        let novels = self.draft_author_novels(&fetched).await?;
        let mut ids = HashSet::new();
        if fetched.id != source.site_id
            || fetched.site != source.site
            || novels.iter().any(|v| {
                v.author_id != source.site_id || v.site != source.site || !ids.insert(v.id.clone())
            })
        {
            return Err(protocol("crawler_author_identity"));
        }
        for novel in &novels {
            validate_chapters(novel)?;
        }
        self.database
            .run("refresh_author_write", move |c| {
                super::write(c, |c| {
                    let current = Author::get(id, c)?;
                    let author = UpdateAuthorModel {
                        id: current.id,
                        name: Some(&fetched.name),
                        avatar: Some(&fetched.image),
                        description: Some(&fetched.description),
                        update_time: OffsetDateTime::now_utc(),
                    }
                    .update(c)?;
                    let old = NovelModel::query_by_author_id(author.id, c)?;
                    if novels.is_empty() && !old.is_empty() {
                        return Err(protocol("crawler_empty_author_listing"));
                    }
                    for previous in &old {
                        if !ids.contains(&previous.site_id) {
                            super::novel::delete_records(previous.id, c)?;
                        }
                    }
                    for novel in &novels {
                        let record =
                            if let Some(previous) = old.iter().find(|v| v.site_id == novel.id) {
                                update_novel(previous.id, novel, c)?
                            } else {
                                let now = OffsetDateTime::now_utc();
                                NewNovel {
                                    name: &novel.name,
                                    avatar: &novel.image,
                                    description: &novel.description,
                                    novel_status: novel.status.into(),
                                    author_id: author.id,
                                    site_id: &novel.id,
                                    site: source.site.into(),
                                    tags: vec![],
                                    create_time: now,
                                    update_time: now,
                                }
                                .create(c)?
                            };
                        sync_chapters(&record, &novel.chapters, c)?;
                    }
                    Ok(author.into())
                })
                .map_err(source_conflict)
            })
            .await
    }
}
fn protocol(operation: &'static str) -> AppError {
    service_errors::Fault::new(
        service_errors::FaultKind::Protocol,
        operation,
        std::io::Error::other("invalid source snapshot"),
    )
    .into()
}
fn validate_chapters(novel: &DraftNovel) -> AppResult<()> {
    let mut ids = HashSet::new();
    if novel
        .chapters
        .iter()
        .any(|v| v.novel_id != novel.id || v.site != novel.site || !ids.insert(&v.id))
    {
        return Err(protocol("crawler_chapter_identity"));
    }
    Ok(())
}
fn update_novel(id: i64, fetched: &DraftNovel, c: &mut PgConnection) -> AppResult<NovelModel> {
    UpdateNovelModel {
        id,
        name: Some(&fetched.name),
        avatar: Some(&fetched.image),
        description: Some(&fetched.description),
        novel_status: Some(fetched.status.into()),
        update_time: OffsetDateTime::now_utc(),
    }
    .update(c)
}
fn sync_chapters(
    novel: &NovelModel,
    fetched: &[DraftChapter],
    c: &mut PgConnection,
) -> AppResult<()> {
    let chapters = ChapterModel::get_by_novel_id(novel.id, c)?;
    if fetched.is_empty() && !chapters.is_empty() {
        return Err(protocol("crawler_empty_chapter_listing"));
    }
    let now = OffsetDateTime::now_utc();
    let fetched_map: HashMap<_, _> = fetched.iter().map(|v| (v.id.as_str(), v)).collect();
    let old_map: HashMap<_, _> = chapters.iter().map(|v| (v.site_id.as_str(), v)).collect();
    let mut updates = vec![];
    let mut inserts = vec![];
    let mut deletes = vec![];
    for old in &chapters {
        match fetched_map.get(old.site_id.as_str()) {
            Some(new)
                if old.title != new.title
                    || old.time != new.time
                    || old.word_count != i64::from(new.word_count) =>
            {
                updates.push(UpdateChapterModel {
                    id: old.id,
                    title: &new.title,
                    time: new.time,
                    word_count: i64::from(new.word_count),
                    update_time: now,
                })
            }
            None => deletes.push(old.id),
            _ => (),
        }
    }
    for new in fetched {
        if !old_map.contains_key(new.id.as_str()) {
            inserts.push(NewChapter {
                title: &new.title,
                site: new.site.into(),
                site_id: &new.id,
                content: None,
                time: new.time,
                word_count: i64::from(new.word_count),
                novel_id: novel.id,
                author_id: novel.author_id,
                create_time: now,
                update_time: now,
            });
        }
    }
    UpdateChapterModel::update_many(&updates, c)?;
    if !inserts.is_empty() {
        NewChapter::create_many(&inserts, c)?;
    }
    ReadRecordModel::delete_by_chapter_ids(&deletes, c)?;
    ChapterModel::delete_by_ids(&deletes, c)?;
    Ok(())
}
