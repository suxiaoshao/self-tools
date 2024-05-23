use std::collections::HashMap;

use async_graphql::InputObject;
use diesel::PgConnection;
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        author::AuthorModel,
        chapter::NewChapter,
        novel::NewNovel,
        schema::custom_type::{NovelSite, NovelStatus},
    },
};

use super::author::Author;

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub struct SaveDraftAuthor {
    id: String,
    site: NovelSite,
    url: String,
    name: String,
    description: String,
    image: String,
    novels: Vec<SaveNovelInfo>,
}

impl SaveDraftAuthor {
    pub fn save(self, conn: &mut PgConnection) -> GraphqlResult<Author> {
        let SaveDraftAuthor {
            id,
            site,
            name,
            description,
            image,
            novels,
            ..
        } = self;
        if AuthorModel::exists_by_site_id(&id, conn)? {
            event!(
                Level::ERROR,
                "作者已存在 site_id:{id},site:{site},name:{name}"
            );
            return Err(GraphqlError::AlreadyExists(name));
        }
        let author = conn
            .build_transaction()
            .run::<Author, GraphqlError, _>(|conn| {
                let now = OffsetDateTime::now_utc();
                // 保存作者
                let author = Author::create(&name, &image, &description, site, &id, conn)?;

                // 保存小说
                let new_novels = novels
                    .iter()
                    .map(
                        |SaveNovelInfo {
                             id,
                             site,
                             name,
                             description,
                             image,

                             novel_status,
                             ..
                         }| {
                            NewNovel {
                                name,
                                avatar: image,
                                description,
                                author_id: author.id,
                                novel_status: *novel_status,
                                site: *site,
                                site_id: id,
                                tags: Vec::new(),
                                collection_id: None,
                                create_time: now,
                                update_time: now,
                            }
                        },
                    )
                    .collect::<Vec<_>>();
                let new_novels = NewNovel::create_many(&new_novels, conn)?;

                // 保存章节
                let new_novels = new_novels
                    .into_iter()
                    .map(|novel| (novel.site_id, novel.id))
                    .collect::<HashMap<String, i64>>();
                let mut new_chapters = vec![];
                for novel in novels.iter() {
                    let SaveNovelInfo { id, chapters, .. } = novel;
                    let novel_id = match new_novels.get(id) {
                        Some(data) => data,
                        None => {
                            event!(Level::ERROR, "site id:{} 没保存到", id);
                            return Err(GraphqlError::SavaDraftError("chapter-novel"));
                        }
                    };
                    for SaveChapterInfo {
                        name,
                        id,
                        time,
                        word_count,
                        ..
                    } in chapters.iter()
                    {
                        let new_chapter = NewChapter {
                            title: name,
                            site,
                            site_id: id,
                            content: None,
                            time: *time,
                            word_count: *word_count as i64,
                            novel_id: *novel_id,
                            author_id: author.id,
                            collection_id: None,
                            create_time: now,
                            update_time: now,
                        };
                        new_chapters.push(new_chapter);
                    }
                }
                NewChapter::create_many(&new_chapters, conn)?;
                Ok(author)
            })?;
        Ok(author)
    }
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub struct SaveNovelInfo {
    id: String,
    site: NovelSite,
    url: String,
    name: String,
    description: String,
    image: String,
    chapters: Vec<SaveChapterInfo>,
    novel_status: NovelStatus,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub struct SaveChapterInfo {
    id: String,
    name: String,
    novel_id: String,
    url: String,
    time: OffsetDateTime,
    word_count: u32,
}
