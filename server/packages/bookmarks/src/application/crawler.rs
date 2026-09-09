//! Converts site implementations to owned application snapshots. Only this adapter knows crawler types.
use super::{Application, NovelSite, NovelStatus};
use crate::errors::{AppError, AppResult};
use novel_crawler::{AuthorFn, ChapterFn, NovelFn, TagFn};
use service_errors::{Fault, FaultKind};
use std::{future::Future, pin::Pin};

type Fetch<'a, T> = Pin<Box<dyn Future<Output = AppResult<T>> + Send + 'a>>;
pub(super) trait Crawler: Send + Sync {
    fn author(&self, site: NovelSite, id: String) -> Fetch<'_, DraftAuthor>;
    fn novel(&self, site: NovelSite, id: String) -> Fetch<'_, DraftNovel>;
}
pub(super) struct Sites;

#[derive(Clone, Debug)]
pub(crate) struct DraftAuthor {
    pub id: String,
    pub site: NovelSite,
    pub url: String,
    pub name: String,
    pub description: String,
    pub image: String,
    pub(super) novel_ids: Vec<String>,
}
#[derive(Clone, Debug)]
pub(crate) struct DraftNovel {
    pub id: String,
    pub site: NovelSite,
    pub url: String,
    pub name: String,
    pub description: String,
    pub image: String,
    pub status: NovelStatus,
    pub(super) author_id: String,
    pub chapters: Vec<DraftChapter>,
    pub tags: Vec<DraftTag>,
}
#[derive(Clone, Debug)]
pub(crate) struct DraftChapter {
    pub id: String,
    pub novel_id: String,
    pub site: NovelSite,
    pub url: String,
    pub title: String,
    pub time: time::OffsetDateTime,
    pub word_count: u32,
}
#[derive(Clone, Debug)]
pub(crate) struct DraftTag {
    pub id: String,
    pub name: String,
    pub url: String,
}
impl Crawler for Sites {
    fn author(&self, site: NovelSite, id: String) -> Fetch<'_, DraftAuthor> {
        Box::pin(async move {
            match site {
                NovelSite::Qidian => author::<novel_crawler::QDAuthor>(&id).await,
                NovelSite::Jjwxc => author::<novel_crawler::JJAuthor>(&id).await,
            }
        })
    }
    fn novel(&self, site: NovelSite, id: String) -> Fetch<'_, DraftNovel> {
        Box::pin(async move {
            match site {
                NovelSite::Qidian => novel::<novel_crawler::QDNovel>(&id).await,
                NovelSite::Jjwxc => novel::<novel_crawler::JJNovel>(&id).await,
            }
        })
    }
}
async fn author<T: AuthorFn>(id: &str) -> AppResult<DraftAuthor> {
    let value = T::get_author_data(id).await.map_err(crawler_error)?;
    Ok(DraftAuthor {
        id: value.id().into(),
        site: T::SITE.into(),
        url: value.url(),
        name: value.name().into(),
        description: value.description().into(),
        image: value.image().into(),
        novel_ids: value.novel_ids().iter().cloned().collect(),
    })
}
async fn novel<T: NovelFn>(id: &str) -> AppResult<DraftNovel> {
    let value = T::get_novel_data(id).await.map_err(crawler_error)?;
    // Both site implementations already load the catalogue in get_novel_data; chapters only clones it.
    let chapters = value
        .chapters()
        .await
        .map_err(crawler_error)?
        .iter()
        .map(|v| DraftChapter {
            id: v.chapter_id().into(),
            novel_id: v.novel_id().into(),
            site: <T::Chapter as ChapterFn>::Author::SITE.into(),
            url: v.url(),
            title: v.title().into(),
            time: v.time(),
            word_count: v.word_count(),
        })
        .collect();
    Ok(DraftNovel {
        id: value.id().into(),
        site: T::Author::SITE.into(),
        url: value.url(),
        name: value.name().into(),
        description: value.description().into(),
        image: value.image().into(),
        status: value.status().into(),
        author_id: value.author_id().into(),
        chapters,
        tags: value
            .tags()
            .iter()
            .map(|v| DraftTag {
                id: v.id().into(),
                name: v.name().into(),
                url: v.url(),
            })
            .collect(),
    })
}
impl From<novel_crawler::NovelSite> for NovelSite {
    fn from(value: novel_crawler::NovelSite) -> Self {
        match value {
            novel_crawler::NovelSite::Qidian => Self::Qidian,
            novel_crawler::NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}
impl From<novel_crawler::NovelStatus> for NovelStatus {
    fn from(value: novel_crawler::NovelStatus) -> Self {
        match value {
            novel_crawler::NovelStatus::Ongoing => Self::Ongoing,
            novel_crawler::NovelStatus::Completed => Self::Completed,
            novel_crawler::NovelStatus::Paused => Self::Paused,
        }
    }
}
impl Application {
    pub(crate) async fn fetch_author(&self, id: String, site: NovelSite) -> AppResult<DraftAuthor> {
        validate_source_id(&id)?;
        self.crawler.author(site, id).await
    }
    pub(crate) async fn fetch_novel(&self, id: String, site: NovelSite) -> AppResult<DraftNovel> {
        validate_source_id(&id)?;
        self.crawler.novel(site, id).await
    }
    pub(crate) async fn draft_author_novels(
        &self,
        author: &DraftAuthor,
    ) -> AppResult<Vec<DraftNovel>> {
        futures::future::try_join_all(
            author
                .novel_ids
                .iter()
                .map(|id| self.crawler.novel(author.site, id.clone())),
        )
        .await
    }
    pub(crate) async fn draft_novel_author(&self, novel: &DraftNovel) -> AppResult<DraftAuthor> {
        self.crawler
            .author(novel.site, novel.author_id.clone())
            .await
    }
}
fn validate_source_id(id: &str) -> AppResult<()> {
    if id.is_empty() || !id.bytes().all(|c| c.is_ascii_digit()) {
        return Err(crate::errors::invalid(
            "id",
            service_errors::ValidationCode::InvalidFormat,
        ));
    }
    Ok(())
}

impl super::Author {
    pub(crate) fn url(&self) -> String {
        match self.site {
            NovelSite::Qidian => novel_crawler::QDAuthor::get_url_from_id(&self.site_id),
            NovelSite::Jjwxc => novel_crawler::JJAuthor::get_url_from_id(&self.site_id),
        }
    }
}

impl super::Novel {
    pub(crate) fn url(&self) -> String {
        match self.site {
            NovelSite::Qidian => novel_crawler::QDNovel::get_url_from_id(&self.site_id),
            NovelSite::Jjwxc => novel_crawler::JJNovel::get_url_from_id(&self.site_id),
        }
    }
}

impl super::Tag {
    pub(crate) fn url(&self) -> String {
        match self.site {
            NovelSite::Qidian => novel_crawler::QDTag::get_url_from_id(&self.site_id),
            NovelSite::Jjwxc => novel_crawler::JJTag::get_url_from_id(&self.site_id),
        }
    }
}

impl super::Chapter {
    pub(crate) fn url(&self) -> String {
        match self.site {
            NovelSite::Qidian => {
                novel_crawler::QDChapter::get_url_from_id(&self.site_id, &self.site_novel_id)
            }
            NovelSite::Jjwxc => {
                novel_crawler::JJChapter::get_url_from_id(&self.site_id, &self.site_novel_id)
            }
        }
    }
}

pub(crate) fn crawler_error(error: novel_crawler::NovelError) -> AppError {
    let kind = match &error {
        novel_crawler::NovelError::NetworkError(source) if source.is_timeout() => {
            FaultKind::Timeout
        }
        novel_crawler::NovelError::NetworkError(source) if source.is_connect() => {
            FaultKind::Network
        }
        _ => FaultKind::Protocol,
    };
    Fault::new(kind, "novel_crawler", error).into()
}
