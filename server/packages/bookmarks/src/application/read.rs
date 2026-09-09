use super::{Application, Collection};
use crate::errors::AppResult;
use std::{collections::HashMap, sync::Arc};
#[derive(Clone)]
pub(crate) enum Ancestry {
    Found(Vec<Arc<Collection>>),
    Missing(i64),
    Cycle,
}
use super::{Author, Chapter, Novel, NovelComment, Tag};
#[derive(Clone)]
pub(crate) struct NovelStats {
    pub word_count: bigdecimal::BigDecimal,
    pub read_percentage: f64,
}
#[derive(Clone, Default)]
pub(crate) struct ChapterEnds {
    pub first: Option<Arc<Chapter>>,
    pub last: Option<Arc<Chapter>>,
}
impl Application {
    pub(crate) async fn batch_authors(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Arc<Author>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_authors", move |conn| {
                super::repository::read::authors(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_novels(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Arc<Novel>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_novels", move |conn| {
                super::repository::read::novels(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_author_novels(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Vec<Arc<Novel>>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_author_novels", move |conn| {
                super::repository::read::author_novels(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_novel_tags(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Vec<Arc<Tag>>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_novel_tags", move |conn| {
                super::repository::read::novel_tags(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_novel_collections(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Vec<Arc<Collection>>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_novel_collections", move |conn| {
                super::repository::read::novel_collections(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_novel_comments(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Arc<NovelComment>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_novel_comments", move |conn| {
                super::repository::read::novel_comments(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_children(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Vec<Arc<Collection>>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_children", move |conn| {
                super::repository::read::children(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_chapters(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Vec<Arc<Chapter>>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_chapters", move |conn| {
                super::repository::read::chapters(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_chapter_ends(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, ChapterEnds>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_chapter_ends", move |conn| {
                super::repository::read::chapter_ends(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_stats(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, NovelStats>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_stats", move |conn| {
                super::repository::read::stats(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_ancestors(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Ancestry>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_ancestors", move |conn| {
                super::repository::read::ancestors(&ids, conn)
            })
            .await
    }
}
