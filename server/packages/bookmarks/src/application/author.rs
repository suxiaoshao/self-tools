use super::NovelSite;

use diesel::PgConnection;

use crate::{
    application::repository::{author::AuthorModel, novel::NovelModel},
    errors::AppResult,
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
            site: value.site.into(),
            name: value.name,
            avatar: value.avatar,
            description: value.description,
            create_time: value.create_time,
            update_time: value.update_time,
            site_id: value.site_id,
        }
    }
}

impl Author {
    /// 创建作者
    pub(super) fn create(
        name: &str,
        avatar: &str,
        description: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        super::write(conn, |conn| {
            Ok(AuthorModel::create(name, avatar, site.into(), site_id, description, conn)?.into())
        })
        .map_err(crate::errors::source_conflict)
    }
    /// 删除作者
    pub(super) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        crate::errors::validate_id(id, "id")?;
        super::write(conn, |conn| {
            if AuthorModel::exists(id, conn)? {
                for novel in NovelModel::ids_by_author_id(id, conn)? {
                    super::novel::delete_records(novel, conn)?;
                }
                AuthorModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
    /// 获取作者
    pub(super) fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
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

    /// 获取全部作者
    pub(super) fn all(conn: &mut PgConnection) -> AppResult<Vec<Author>> {
        let authors = AuthorModel::all(conn)?;
        Ok(authors.into_iter().map(Into::into).collect())
    }
    /// 更具搜索获取全部作者
    pub(super) fn search(search_name: String, conn: &mut PgConnection) -> AppResult<Vec<Author>> {
        let authors = AuthorModel::search_all(search_name, conn)?;
        Ok(authors.into_iter().map(Into::into).collect())
    }
}
