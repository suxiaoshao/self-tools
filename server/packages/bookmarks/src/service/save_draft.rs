use crate::{
    errors::*,
    model::{
        author::{AuthorModel, UpdateAuthorModel},
        chapter::NewChapter,
        novel::NewNovel,
        schema::custom_type::{NovelSite, NovelStatus},
        tag::TagModel,
    },
    service::{author::Author, novel::Novel},
};
use diesel::PgConnection;
use std::collections::HashSet;
use time::OffsetDateTime;
#[derive(Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveDraftAuthor {
    pub(crate) id: String,
    pub(crate) site: NovelSite,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) image: String,
    pub(crate) novels: Vec<SaveNovelInfo>,
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveNovelInfo {
    pub(crate) id: String,
    pub(crate) site: NovelSite,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) image: String,
    pub(crate) chapters: Vec<SaveChapterInfo>,
    pub(crate) tags: Vec<SaveTagInfo>,
    pub(crate) novel_status: NovelStatus,
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveChapterInfo {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) time: time::OffsetDateTime,
    pub(crate) word_count: u32,
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveTagInfo {
    pub(crate) id: String,
    pub(crate) name: String,
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveDraftNovel {
    pub(crate) id: String,
    pub(crate) site: NovelSite,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) image: String,
    pub(crate) chapters: Vec<SaveChapterInfo>,
    pub(crate) tags: Vec<SaveTagInfo>,
    pub(crate) novel_status: NovelStatus,
    pub(crate) author: SaveAuthorInfo,
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveAuthorInfo {
    pub(crate) id: String,
    pub(crate) site: NovelSite,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) image: String,
}
fn validate_tags(tags: &[SaveTagInfo], path: &str) -> AppResult<()> {
    for (index, tag) in tags.iter().enumerate() {
        if tag.name.chars().count() > 20 {
            return Err(invalid(
                &format!("{path}.{index}.name"),
                service_errors::ValidationCode::TooLong,
            ));
        }
    }
    Ok(())
}
fn validate_chapters(chapters: &[SaveChapterInfo], path: &str) -> AppResult<()> {
    let mut ids = HashSet::new();
    for (index, chapter) in chapters.iter().enumerate() {
        if !ids.insert(&chapter.id) {
            return Err(invalid(
                &format!("{path}.{index}.id"),
                service_errors::ValidationCode::InvalidFormat,
            ));
        }
        if chapter.name.chars().count() > 255 {
            return Err(invalid(
                &format!("{path}.{index}.name"),
                service_errors::ValidationCode::TooLong,
            ));
        }
    }
    Ok(())
}
pub(crate) fn save_tags(
    site: NovelSite,
    tags: &[SaveTagInfo],
    conn: &mut PgConnection,
) -> AppResult<Vec<i64>> {
    let mut existing = TagModel::many_site_id_by_site(site, conn)?;
    let mut result = vec![];
    for tag in tags {
        let id = match existing.get(&tag.id) {
            Some(id) => *id,
            None => {
                let value = TagModel::create(&tag.name, site, &tag.id, conn)?;
                existing.insert(tag.id.clone(), value.id);
                value.id
            }
        };
        if !result.contains(&id) {
            result.push(id);
        }
    }
    Ok(result)
}
fn save_chapters(
    chapters: &[SaveChapterInfo],
    site: NovelSite,
    novel_id: i64,
    author_id: i64,
    conn: &mut PgConnection,
) -> AppResult<()> {
    let now = OffsetDateTime::now_utc();
    let chapters = chapters
        .iter()
        .map(|c| NewChapter {
            title: &c.name,
            site,
            site_id: &c.id,
            content: None,
            time: c.time,
            word_count: i64::from(c.word_count),
            novel_id,
            author_id,
            create_time: now,
            update_time: now,
        })
        .collect::<Vec<_>>();
    if !chapters.is_empty() {
        NewChapter::create_many(&chapters, conn)?;
    }
    Ok(())
}
impl SaveDraftAuthor {
    pub(crate) fn save(self, conn: &mut PgConnection) -> AppResult<Author> {
        let mut ids = HashSet::new();
        for (index, novel) in self.novels.iter().enumerate() {
            if novel.site != self.site {
                return Err(invalid(
                    &format!("author.novels.{index}.site"),
                    service_errors::ValidationCode::InvalidFormat,
                ));
            }
            if !ids.insert(&novel.id) {
                return Err(invalid(
                    &format!("author.novels.{index}.id"),
                    service_errors::ValidationCode::InvalidFormat,
                ));
            }
            validate_chapters(&novel.chapters, &format!("author.novels.{index}.chapters"))?;
            validate_tags(&novel.tags, &format!("author.novels.{index}.tags"))?;
        }
        super::write(conn, |conn| {
            let author = Author::create(
                &self.name,
                &self.image,
                &self.description,
                self.site,
                &self.id,
                conn,
            )?;
            let now = OffsetDateTime::now_utc();
            for novel in &self.novels {
                let tags = save_tags(self.site, &novel.tags, conn)?;
                let inserted = NewNovel {
                    name: &novel.name,
                    avatar: &novel.image,
                    description: &novel.description,
                    author_id: author.id,
                    novel_status: novel.novel_status,
                    site: self.site,
                    site_id: &novel.id,
                    tags,
                    create_time: now,
                    update_time: now,
                }
                .create(conn)?;
                save_chapters(&novel.chapters, self.site, inserted.id, author.id, conn)?;
            }
            Ok(author)
        })
        .map_err(source_conflict)
    }
}
impl SaveDraftNovel {
    pub(crate) fn save(self, conn: &mut PgConnection) -> AppResult<Novel> {
        if self.site != self.author.site {
            return Err(invalid(
                "novel.author.site",
                service_errors::ValidationCode::InvalidFormat,
            ));
        }
        validate_chapters(&self.chapters, "novel.chapters")?;
        validate_tags(&self.tags, "novel.tags")?;
        super::write(conn, |conn| {
            let now = OffsetDateTime::now_utc();
            let author = match AuthorModel::get_id_by_site_id(&self.author.id, self.site, conn)? {
                Some(id) => UpdateAuthorModel {
                    id,
                    name: Some(&self.author.name),
                    avatar: Some(&self.author.image),
                    description: Some(&self.author.description),
                    update_time: now,
                }
                .update(conn)?,
                None => AuthorModel::create(
                    &self.author.name,
                    &self.author.image,
                    self.site,
                    &self.author.id,
                    &self.author.description,
                    conn,
                )?,
            };
            let tags = save_tags(self.site, &self.tags, conn)?;
            let novel = NewNovel {
                name: &self.name,
                avatar: &self.image,
                description: &self.description,
                author_id: author.id,
                novel_status: self.novel_status,
                site: self.site,
                site_id: &self.id,
                tags,
                create_time: now,
                update_time: now,
            }
            .create(conn)?;
            save_chapters(&self.chapters, self.site, novel.id, author.id, conn)?;
            Ok(novel.into())
        })
        .map_err(source_conflict)
    }
}
