use std::collections::HashMap;

use async_graphql::InputObject;
use diesel::PgConnection;
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{
        author::{AuthorModel, UpdateAuthorModel},
        chapter::NewChapter,
        novel::{NewNovel, NovelModel},
        schema::custom_type::{NovelSite, NovelStatus},
        tag::{NewTag, TagModel},
    },
    service::novel::Novel,
};

use super::author::Author;

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveDraftAuthor {
    id: String,
    site: NovelSite,
    name: String,
    description: String,
    image: String,
    novels: Vec<SaveNovelInfo>,
}

impl SaveDraftAuthor {
    pub(crate) fn save(self, conn: &mut PgConnection) -> GraphqlResult<Author> {
        let SaveDraftAuthor {
            id,
            site,
            name,
            description,
            image,
            novels,
            ..
        } = self;
        if AuthorModel::exists_by_site_id(&id, site, conn)? {
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

                // 保存 tag
                let all_tags = TagModel::many_site_id_by_site(site, conn)?;
                let new_tags = novels
                    .iter()
                    .flat_map(|x| &x.tags)
                    .filter_map(|SaveTagInfo { id, name }| {
                        if all_tags.contains_key(id) {
                            None
                        } else {
                            Some((
                                id,
                                NewTag {
                                    name,
                                    site,
                                    site_id: id,
                                    create_time: now,
                                    update_time: now,
                                },
                            ))
                        }
                    })
                    .collect::<HashMap<_, _>>()
                    .into_values()
                    .collect::<Vec<_>>();
                NewTag::save_many(&new_tags, conn)?;
                let all_tags = TagModel::many_site_id_by_site(site, conn)?;

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
                             tags,
                             ..
                         }| {
                            let tags = tags
                                .iter()
                                .filter_map(|SaveTagInfo { id, .. }| all_tags.get(id).copied())
                                .collect();
                            NewNovel {
                                name,
                                avatar: image,
                                description,
                                author_id: author.id,
                                novel_status: *novel_status,
                                site: *site,
                                site_id: id,
                                tags,
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
pub(crate) struct SaveNovelInfo {
    id: String,
    site: NovelSite,
    name: String,
    description: String,
    image: String,
    chapters: Vec<SaveChapterInfo>,
    tags: Vec<SaveTagInfo>,
    novel_status: NovelStatus,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveChapterInfo {
    id: String,
    name: String,
    time: OffsetDateTime,
    word_count: u32,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveTagInfo {
    id: String,
    name: String,
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveDraftNovel {
    id: String,
    site: NovelSite,
    name: String,
    description: String,
    image: String,
    chapters: Vec<SaveChapterInfo>,
    tags: Vec<SaveTagInfo>,
    novel_status: NovelStatus,
    author: SaveAuthorInfo,
}

impl SaveDraftNovel {
    pub(crate) fn save(self, conn: &mut PgConnection) -> GraphqlResult<Novel> {
        let SaveDraftNovel {
            id,
            site,
            name,
            description,
            image,
            chapters,
            tags,
            novel_status,
            author,
        } = self;
        if NovelModel::exists_by_site_id(&id, site, conn)? {
            event!(
                Level::ERROR,
                "小说已存在 site_id:{id},site:{site},name:{name}"
            );
            return Err(GraphqlError::AlreadyExists(name));
        }
        let author_id = AuthorModel::get_id_by_site_id(&author.id, self.site, conn)?;
        let novel = conn
            .build_transaction()
            .run::<Novel, GraphqlError, _>(|conn| {
                let now = OffsetDateTime::now_utc();
                // 保存作者信息
                let author = match author_id {
                    Some(author_id) => {
                        let update_author = UpdateAuthorModel {
                            id: author_id,
                            name: Some(&author.name),
                            avatar: Some(&author.image),
                            description: Some(&author.description),
                            update_time: now,
                        };
                        update_author.update(conn)?
                    }
                    None => AuthorModel::create(
                        &author.name,
                        &author.image,
                        site,
                        &author.id,
                        &author.description,
                        conn,
                    )?,
                };
                // 保存 tag
                let all_tags = TagModel::many_site_id_by_site(site, conn)?;
                let new_tags = tags
                    .iter()
                    .filter_map(|SaveTagInfo { id, name }| {
                        if all_tags.contains_key(id) {
                            None
                        } else {
                            Some((
                                id,
                                NewTag {
                                    name,
                                    site,
                                    site_id: id,
                                    create_time: now,
                                    update_time: now,
                                },
                            ))
                        }
                    })
                    .collect::<HashMap<_, _>>()
                    .into_values()
                    .collect::<Vec<_>>();
                NewTag::save_many(&new_tags, conn)?;
                let all_tags = TagModel::many_site_id_by_site(site, conn)?;

                // 保存小说
                let tags = tags
                    .iter()
                    .filter_map(|SaveTagInfo { id, .. }| all_tags.get(id).copied())
                    .collect();
                let new_novel = NewNovel {
                    name: &name,
                    avatar: &image,
                    description: &description,
                    author_id: author.id,
                    novel_status,
                    site,
                    site_id: &id,
                    tags,
                    create_time: now,
                    update_time: now,
                };
                let new_novel = new_novel.create(conn)?;

                // 保存章节
                let new_chapters = chapters
                    .iter()
                    .map(
                        |SaveChapterInfo {
                             id,
                             name,
                             time,
                             word_count,
                         }| NewChapter {
                            novel_id: new_novel.id,
                            create_time: now,
                            update_time: now,
                            site,
                            site_id: id,
                            time: *time,
                            word_count: *word_count as i64,
                            author_id: author.id,
                            title: name,
                            content: None,
                        },
                    )
                    .collect::<Vec<_>>();
                NewChapter::create_many(&new_chapters, conn)?;
                Ok(new_novel.into())
            })?;
        Ok(novel)
    }
}

#[derive(InputObject, Clone, Eq, PartialEq, Debug)]
pub(crate) struct SaveAuthorInfo {
    id: String,
    site: NovelSite,
    name: String,
    description: String,
    image: String,
}
