/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 11:50:52
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/author.rs
 */

use diesel::PgConnection;
use novel_crawler::{AuthorFn, NovelFn};
use service_query::Queryable;
use time::OffsetDateTime;

use crate::{
    errors::{AppError, AppResult},
    model::{
        PgPool,
        author::{AuthorModel, UpdateAuthorModel},
        novel::{NewNovel, NovelModel, UpdateNovelModel},
        schema::custom_type::NovelSite,
    },
};

pub(crate) struct Author {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) avatar: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) description: String,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
}

impl From<AuthorModel> for Author {
    fn from(value: AuthorModel) -> Self {
        Self {
            id: value.id,
            site: value.site,
            name: value.name,
            avatar: value.avatar,
            description: value.description,
            create_time: value.create_time,
            update_time: value.update_time,
            site_id: value.site_id,
        }
    }
}

impl<'a, T: AuthorFn> From<(&'a Author, &'a T)> for UpdateAuthorModel<'a> {
    fn from(value: (&'a Author, &'a T)) -> Self {
        let now = OffsetDateTime::now_utc();
        let (author, fetch_author) = value;
        Self {
            id: author.id,
            name: if fetch_author.name() == author.name {
                None
            } else {
                Some(fetch_author.name())
            },
            avatar: if fetch_author.image() == author.avatar {
                None
            } else {
                Some(fetch_author.image())
            },
            description: if fetch_author.description() == author.description {
                None
            } else {
                Some(fetch_author.description())
            },
            update_time: now,
        }
    }
}

impl Author {
    /// 创建作者
    pub(crate) fn create(
        name: &str,
        avatar: &str,
        description: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        super::write(conn, |conn| {
            Ok(AuthorModel::create(name, avatar, site, site_id, description, conn)?.into())
        })
        .map_err(crate::errors::source_conflict)
    }
    /// 删除作者
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        crate::errors::validate_id(id, "id")?;
        super::write(conn, |conn| {
            if AuthorModel::exists(id, conn)? {
                for novel in NovelModel::ids_by_author_id(id, conn)? {
                    super::novel::Novel::delete_inner(novel, conn)?;
                }
                AuthorModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
    /// 获取作者
    pub(crate) fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        crate::errors::validate_id(id, "id")?;
        // 作者不存在
        if !AuthorModel::exists(id, conn)? {
            return Err(crate::errors::missing(
                crate::errors::ResourceKind::Author,
                id,
            ));
        }
        let author = AuthorModel::get(id, conn)?;
        Ok(author.into())
    }
    /// update by crawler
    pub(crate) async fn update_by_crawler<T: novel_crawler::AuthorFn>(
        &self,
        pool: PgPool,
    ) -> AppResult<Self> {
        use std::collections::HashSet;
        let fetched = T::get_author_data(&self.site_id)
            .await
            .map_err(crate::errors::crawler_error)?;
        let novels = fetched
            .novels()
            .await
            .map_err(crate::errors::crawler_error)?;
        let mut ids = HashSet::new();
        if fetched.id() != self.site_id
            || NovelSite::from(T::SITE) != self.site
            || novels
                .iter()
                .any(|n| n.author_id() != self.site_id || !ids.insert(n.id()))
        {
            return Err(service_errors::Fault::new(
                service_errors::FaultKind::Protocol,
                "crawler_author_identity",
                novel_crawler::NovelError::ParseError,
            )
            .into());
        }
        let mut chapters = Vec::new();
        for novel in &novels {
            let fetched_chapters = novel
                .chapters()
                .await
                .map_err(crate::errors::crawler_error)?;
            super::novel::validate_crawler_chapters(novel, &fetched_chapters)?;
            chapters.push(fetched_chapters);
        }
        let mut conn = pool.get()?;
        super::write(&mut conn, |conn| {
            let current = Self::get(self.id, conn)?;
            let update: UpdateAuthorModel = (&current, &fetched).into();
            let author = update.update(conn)?;
            let old = NovelModel::query_by_author_id(author.id, conn)?;
            if novels.is_empty() && !old.is_empty() {
                return Err(service_errors::Fault::new(
                    service_errors::FaultKind::Protocol,
                    "crawler_empty_author_listing",
                    novel_crawler::NovelError::ParseError,
                )
                .into());
            }
            for previous in &old {
                if !ids.contains(previous.site_id.as_str()) {
                    super::novel::Novel::delete_inner(previous.id, conn)?;
                }
            }
            let now = OffsetDateTime::now_utc();
            for (novel, chapters) in novels.iter().zip(&chapters) {
                let record = if let Some(previous) = old.iter().find(|n| n.site_id == novel.id()) {
                    UpdateNovelModel {
                        id: previous.id,
                        name: Some(novel.name()),
                        avatar: Some(novel.image()),
                        description: Some(novel.description()),
                        novel_status: Some(novel.status().into()),
                        update_time: now,
                    }
                    .update(conn)?
                } else {
                    NewNovel {
                        name: novel.name(),
                        avatar: novel.image(),
                        description: novel.description(),
                        novel_status: novel.status().into(),
                        author_id: author.id,
                        site_id: novel.id(),
                        site: self.site,
                        tags: vec![],
                        create_time: now,
                        update_time: now,
                    }
                    .create(conn)?
                };
                super::novel::sync_chapters(&record, chapters, conn)?;
            }
            Ok(author.into())
        })
        .map_err(crate::errors::source_conflict)
    }
    /// 获取全部作者
    pub(crate) fn all(conn: &mut PgConnection) -> AppResult<Vec<Author>> {
        let authors = AuthorModel::all(conn)?;
        Ok(authors.into_iter().map(Into::into).collect())
    }
    /// 更具搜索获取全部作者
    pub(crate) fn search(search_name: String, conn: &mut PgConnection) -> AppResult<Vec<Author>> {
        let authors = AuthorModel::search_all(search_name, conn)?;
        Ok(authors.into_iter().map(Into::into).collect())
    }
}

pub(crate) struct AuthorRunner {
    conn: PgPool,
    count: i64,
    search_name: Option<String>,
}

impl AuthorRunner {
    pub(crate) fn new(conn: PgPool, search_name: Option<String>) -> AppResult<Self> {
        let conn_temp = &mut conn.get()?;
        let count = match &search_name {
            Some(name) => AuthorModel::get_search_count(name, conn_temp)?,
            None => AuthorModel::get_count(conn_temp)?,
        };
        Ok(Self {
            conn,
            count,
            search_name,
        })
    }
}

impl Queryable for AuthorRunner {
    type Item = Author;

    type Error = AppError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: service_query::Paginate>(
        &self,
        pagination: P,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();

        let limit = pagination.limit();
        let conn = &mut self.conn.get()?;
        let data = match &self.search_name {
            Some(name) => AuthorModel::search_list_with_page(name, offset, limit, conn)?,
            None => AuthorModel::list_with_page(offset, limit, conn)?,
        };
        Ok(data.into_iter().map(|x| x.into()).collect())
    }
}

impl Author {
    pub(crate) async fn refresh(id: i64, pool: PgPool) -> AppResult<Self> {
        crate::errors::validate_id(id, "authorId")?;
        let value = {
            let mut conn = pool.get()?;
            Self::get(id, &mut conn)?
        };
        match value.site {
            NovelSite::Qidian => {
                value
                    .update_by_crawler::<novel_crawler::QDAuthor>(pool)
                    .await
            }
            NovelSite::Jjwxc => {
                value
                    .update_by_crawler::<novel_crawler::JJAuthor>(pool)
                    .await
            }
        }
    }
}
