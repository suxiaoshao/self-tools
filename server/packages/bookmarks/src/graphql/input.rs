use super::enums::{NovelSite, NovelStatus};
use async_graphql::InputObject;
use graphql_common::DateTime;
use std::collections::HashSet;
#[derive(InputObject, Clone)]
pub(crate) struct CreateNovelInput {
    pub(crate) name: String,
    pub(crate) avatar: String,
    pub(crate) description: String,
    pub(crate) author_id: i64,
    pub(crate) novel_status: NovelStatus,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) tags: HashSet<i64>,
}
impl From<CreateNovelInput> for crate::service::novel::CreateNovelInput {
    fn from(v: CreateNovelInput) -> Self {
        Self {
            name: v.name,
            avatar: v.avatar,
            description: v.description,
            author_id: v.author_id,
            novel_status: v.novel_status.into(),
            site: v.site.into(),
            site_id: v.site_id,
            tags: v.tags,
        }
    }
}
#[derive(InputObject, Clone)]
pub(crate) struct SaveDraftAuthor {
    pub(crate) id: String,
    pub(crate) site: NovelSite,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) image: String,
    pub(crate) novels: Vec<SaveNovelInfo>,
}
impl From<SaveDraftAuthor> for crate::service::save_draft::SaveDraftAuthor {
    fn from(v: SaveDraftAuthor) -> Self {
        Self {
            id: v.id,
            site: v.site.into(),
            name: v.name,
            description: v.description,
            image: v.image,
            novels: v.novels.into_iter().map(Into::into).collect(),
        }
    }
}
#[derive(InputObject, Clone)]
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
impl From<SaveNovelInfo> for crate::service::save_draft::SaveNovelInfo {
    fn from(v: SaveNovelInfo) -> Self {
        Self {
            id: v.id,
            site: v.site.into(),
            name: v.name,
            description: v.description,
            image: v.image,
            chapters: v.chapters.into_iter().map(Into::into).collect(),
            tags: v.tags.into_iter().map(Into::into).collect(),
            novel_status: v.novel_status.into(),
        }
    }
}
#[derive(InputObject, Clone)]
pub(crate) struct SaveChapterInfo {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) time: DateTime,
    pub(crate) word_count: u32,
}
impl From<SaveChapterInfo> for crate::service::save_draft::SaveChapterInfo {
    fn from(v: SaveChapterInfo) -> Self {
        Self {
            id: v.id,
            name: v.name,
            time: v.time.into(),
            word_count: v.word_count,
        }
    }
}
#[derive(InputObject, Clone)]
pub(crate) struct SaveTagInfo {
    pub(crate) id: String,
    pub(crate) name: String,
}
impl From<SaveTagInfo> for crate::service::save_draft::SaveTagInfo {
    fn from(v: SaveTagInfo) -> Self {
        Self {
            id: v.id,
            name: v.name,
        }
    }
}
#[derive(InputObject, Clone)]
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
impl From<SaveDraftNovel> for crate::service::save_draft::SaveDraftNovel {
    fn from(v: SaveDraftNovel) -> Self {
        Self {
            id: v.id,
            site: v.site.into(),
            name: v.name,
            description: v.description,
            image: v.image,
            chapters: v.chapters.into_iter().map(Into::into).collect(),
            tags: v.tags.into_iter().map(Into::into).collect(),
            novel_status: v.novel_status.into(),
            author: v.author.into(),
        }
    }
}
#[derive(InputObject, Clone)]
pub(crate) struct SaveAuthorInfo {
    pub(crate) id: String,
    pub(crate) site: NovelSite,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) image: String,
}
impl From<SaveAuthorInfo> for crate::service::save_draft::SaveAuthorInfo {
    fn from(v: SaveAuthorInfo) -> Self {
        Self {
            id: v.id,
            site: v.site.into(),
            name: v.name,
            description: v.description,
            image: v.image,
        }
    }
}
