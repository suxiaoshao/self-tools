/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 20:43:34
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-29 14:44:34
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/output/mod.rs
 */
use async_graphql::Object;
use novel_crawler::{
    AuthorFn, ChapterFn, JJAuthor, JJChapter, JJNovel, NovelFn, QDAuthor, QDChapter, QDNovel,
};
use time::OffsetDateTime;

use crate::{
    errors::GraphqlResult,
    model::schema::custom_type::{NovelSite, NovelStatus},
};

#[derive(Clone, Eq, PartialEq, Debug)]
pub enum DraftAuthorInfo {
    Qidian(QDAuthor),
    Jjwxc(JJAuthor),
}

#[Object]
impl DraftAuthorInfo {
    async fn url(&self) -> String {
        match self {
            DraftAuthorInfo::Qidian(inner) => inner.url(),
            DraftAuthorInfo::Jjwxc(inner) => inner.url(),
        }
    }
    async fn name(&self) -> String {
        match self {
            DraftAuthorInfo::Qidian(inner) => inner.name().to_owned(),
            DraftAuthorInfo::Jjwxc(inner) => inner.name().to_owned(),
        }
    }
    async fn description(&self) -> String {
        match self {
            DraftAuthorInfo::Qidian(inner) => inner.description().to_owned(),
            DraftAuthorInfo::Jjwxc(inner) => inner.description().to_owned(),
        }
    }
    async fn image(&self) -> String {
        match self {
            DraftAuthorInfo::Qidian(inner) => inner.image().to_owned(),
            DraftAuthorInfo::Jjwxc(inner) => inner.image().to_owned(),
        }
    }
    async fn novels(&self) -> GraphqlResult<Vec<DraftNovelInfo>> {
        match self {
            DraftAuthorInfo::Qidian(inner) => {
                let data = inner.novels().await?;
                Ok(data.into_iter().map(DraftNovelInfo::Qidian).collect())
            }
            DraftAuthorInfo::Jjwxc(inner) => {
                let data = inner.novels().await?;
                Ok(data.into_iter().map(DraftNovelInfo::Jjwxc).collect())
            }
        }
    }
    async fn id(&self) -> String {
        match self {
            DraftAuthorInfo::Qidian(inner) => inner.id().to_owned(),
            DraftAuthorInfo::Jjwxc(inner) => inner.id().to_owned(),
        }
    }
    async fn site(&self) -> NovelSite {
        match self {
            DraftAuthorInfo::Qidian(_) => NovelSite::Qidian,
            DraftAuthorInfo::Jjwxc(_) => NovelSite::Jjwxc,
        }
    }
}

impl DraftAuthorInfo {
    pub async fn new(id: String, novel_site: NovelSite) -> GraphqlResult<Self> {
        match novel_site {
            NovelSite::Qidian => Ok(DraftAuthorInfo::Qidian(
                novel_crawler::QDAuthor::get_author_data(&id).await?,
            )),
            NovelSite::Jjwxc => Ok(DraftAuthorInfo::Jjwxc(
                novel_crawler::JJAuthor::get_author_data(&id).await?,
            )),
        }
    }
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub enum DraftNovelInfo {
    Qidian(QDNovel),
    Jjwxc(JJNovel),
}

#[Object]
impl DraftNovelInfo {
    async fn url(&self) -> String {
        match self {
            DraftNovelInfo::Qidian(inner) => inner.url(),
            DraftNovelInfo::Jjwxc(inner) => inner.url(),
        }
    }
    async fn name(&self) -> String {
        match self {
            DraftNovelInfo::Qidian(inner) => inner.name().to_owned(),
            DraftNovelInfo::Jjwxc(inner) => inner.name().to_owned(),
        }
    }
    async fn description(&self) -> String {
        match self {
            DraftNovelInfo::Qidian(inner) => inner.description().to_owned(),
            DraftNovelInfo::Jjwxc(inner) => inner.description().to_owned(),
        }
    }
    async fn image(&self) -> String {
        match self {
            DraftNovelInfo::Qidian(inner) => inner.image().to_owned(),
            DraftNovelInfo::Jjwxc(inner) => inner.image().to_owned(),
        }
    }
    async fn chapters(&self) -> GraphqlResult<Vec<DraftChapterInfo>> {
        match self {
            DraftNovelInfo::Qidian(inner) => {
                let data = inner.chapters().await?;
                Ok(data.into_iter().map(DraftChapterInfo::Qidian).collect())
            }
            DraftNovelInfo::Jjwxc(inner) => {
                let data = inner.chapters().await?;
                Ok(data.into_iter().map(DraftChapterInfo::Jjwxc).collect())
            }
        }
    }
    async fn author(&self) -> GraphqlResult<DraftAuthorInfo> {
        match self {
            DraftNovelInfo::Qidian(inner) => {
                let data = inner.author().await?;
                Ok(DraftAuthorInfo::Qidian(data))
            }
            DraftNovelInfo::Jjwxc(inner) => {
                let data = inner.author().await?;
                Ok(DraftAuthorInfo::Jjwxc(data))
            }
        }
    }
    async fn status(&self) -> NovelStatus {
        match self {
            DraftNovelInfo::Qidian(inner) => inner.status().into(),
            DraftNovelInfo::Jjwxc(inner) => inner.status().into(),
        }
    }
    async fn id(&self) -> String {
        match self {
            DraftNovelInfo::Qidian(inner) => inner.id().to_owned(),
            DraftNovelInfo::Jjwxc(inner) => inner.id().to_owned(),
        }
    }
    async fn site(&self) -> NovelSite {
        match self {
            DraftNovelInfo::Qidian(_) => NovelSite::Qidian,
            DraftNovelInfo::Jjwxc(_) => NovelSite::Jjwxc,
        }
    }
}

impl DraftNovelInfo {
    pub async fn new(id: String, novel_site: NovelSite) -> GraphqlResult<Self> {
        match novel_site {
            NovelSite::Qidian => Ok(DraftNovelInfo::Qidian(
                novel_crawler::QDNovel::get_novel_data(&id).await?,
            )),
            NovelSite::Jjwxc => Ok(DraftNovelInfo::Jjwxc(
                novel_crawler::JJNovel::get_novel_data(&id).await?,
            )),
        }
    }
}

#[derive(Clone, Eq, PartialEq, Debug)]
pub enum DraftChapterInfo {
    Qidian(QDChapter),
    Jjwxc(JJChapter),
}

#[Object]
impl DraftChapterInfo {
    async fn url(&self) -> String {
        match self {
            DraftChapterInfo::Qidian(inner) => inner.url(),
            DraftChapterInfo::Jjwxc(inner) => inner.url(),
        }
    }
    async fn title(&self) -> String {
        match self {
            DraftChapterInfo::Qidian(inner) => inner.title().to_owned(),
            DraftChapterInfo::Jjwxc(inner) => inner.title().to_owned(),
        }
    }
    async fn time(&self) -> OffsetDateTime {
        match self {
            DraftChapterInfo::Qidian(inner) => inner.time(),
            DraftChapterInfo::Jjwxc(inner) => inner.time(),
        }
    }
    async fn word_count(&self) -> u32 {
        match self {
            DraftChapterInfo::Qidian(inner) => inner.word_count(),
            DraftChapterInfo::Jjwxc(inner) => inner.word_count(),
        }
    }
    async fn novel_id(&self) -> String {
        match self {
            DraftChapterInfo::Qidian(inner) => inner.novel_id().to_owned(),
            DraftChapterInfo::Jjwxc(inner) => inner.novel_id().to_owned(),
        }
    }
    async fn id(&self) -> String {
        match self {
            DraftChapterInfo::Qidian(inner) => inner.chapter_id().to_owned(),
            DraftChapterInfo::Jjwxc(inner) => inner.chapter_id().to_owned(),
        }
    }
    async fn site(&self) -> NovelSite {
        match self {
            DraftChapterInfo::Qidian(_) => NovelSite::Qidian,
            DraftChapterInfo::Jjwxc(_) => NovelSite::Jjwxc,
        }
    }
}
