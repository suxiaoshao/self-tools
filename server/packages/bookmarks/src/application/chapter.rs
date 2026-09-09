use super::NovelSite;

pub(crate) struct Chapter {
    pub(crate) id: i64,
    pub(crate) title: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) content: Option<String>,
    pub(crate) time: time::OffsetDateTime,
    pub(crate) word_count: i64,
    pub(crate) novel_id: i64,
    pub(crate) author_id: i64,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
    pub(crate) site_novel_id: String,
    pub(crate) is_read: bool,
}

impl Chapter {
    pub(super) fn from(
        value: crate::application::repository::chapter::ChapterModel,
        site_novel_id: String,
    ) -> Self {
        Self {
            id: value.id,
            title: value.title,
            site: value.site.into(),
            site_id: value.site_id,
            content: value.content,
            time: value.time,
            word_count: value.word_count,
            novel_id: value.novel_id,
            author_id: value.author_id,
            create_time: value.create_time,
            update_time: value.update_time,
            site_novel_id,
            is_read: value.is_read,
        }
    }
}
