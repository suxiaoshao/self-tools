use super::schema::{
    author::{self},
    custom_type::NovelSite,
};
use crate::errors::AppResult;
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
pub(in crate::application) struct AuthorModel {
    pub(in crate::application) id: i64,
    pub(in crate::application) name: String,
    pub(in crate::application) avatar: String,
    pub(in crate::application) site: NovelSite,
    pub(in crate::application) site_id: String,
    pub(in crate::application) description: String,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

/// id 相关的操作
impl AuthorModel {
    /// 创建作者
    pub(in crate::application) fn create(
        name: &str,
        avatar: &str,
        site: NovelSite,
        site_id: &str,
        description: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_author = NewAuthor {
            site,
            name,
            avatar,
            description,
            site_id,
            create_time: now,
            update_time: now,
        };

        let new_author = diesel::insert_into(author::table)
            .values(&new_author)
            .get_result(conn)?;
        Ok(new_author)
    }
    /// 是否存在
    pub(in crate::application) fn exists(id: i64, conn: &mut PgConnection) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(author::table.filter(author::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除作者
    pub(in crate::application) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let deleted = diesel::delete(author::table.filter(author::id.eq(id))).get_result(conn)?;
        Ok(deleted)
    }
    /// 获取作者
    pub(in crate::application) fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let author = author::table.filter(author::id.eq(id)).first(conn)?;
        Ok(author)
    }
}

impl AuthorModel {
    /// 获取作者
    pub(in crate::application) fn list_with_page(
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let authors = author::table.offset(offset).limit(limit).load(conn)?;
        Ok(authors)
    }
    /// 获取所有作者
    pub(in crate::application) fn all(conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let authors = author::table.load(conn)?;
        Ok(authors)
    }
    /// 获取搜索全部作者
    pub(in crate::application) fn search_all(
        search_name: String,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let authors = author::table
            .filter(author::name.like(format!("%{search_name}%")))
            .load(conn)?;
        Ok(authors)
    }
    /// 获取作者搜索列表
    pub(in crate::application) fn search_list_with_page(
        search_name: &str,
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let authors = author::table
            .filter(author::name.like(format!("%{search_name}%")))
            .offset(offset)
            .limit(limit)
            .load(conn)?;
        Ok(authors)
    }
    /// 获取所有作者数量
    pub(in crate::application) fn get_count(conn: &mut PgConnection) -> AppResult<i64> {
        let count = author::table.count().get_result(conn)?;
        Ok(count)
    }
    /// 获取作者搜索数量
    pub(in crate::application) fn get_search_count(
        search_name: &str,
        conn: &mut PgConnection,
    ) -> AppResult<i64> {
        let count = author::table
            .filter(author::name.like(format!("%{search_name}%")))
            .count()
            .get_result(conn)?;
        Ok(count)
    }
}

/// site_id 相关的操作
impl AuthorModel {
    pub(in crate::application) fn get_id_by_site_id(
        site_id: &str,
        site: NovelSite,
        conn: &mut PgConnection,
    ) -> AppResult<Option<i64>> {
        let id = author::table
            .filter(author::site_id.eq(site_id).and(author::site.eq(site)))
            .select(author::id)
            .first(conn);
        match id {
            Ok(id) => Ok(Some(id)),
            Err(diesel::NotFound) => Ok(None),
            Err(err) => Err(err.into()),
        }
    }
}

#[derive(Insertable)]
#[diesel(table_name = author)]
pub(in crate::application) struct NewAuthor<'a> {
    pub(in crate::application) name: &'a str,
    pub(in crate::application) avatar: &'a str,
    pub(in crate::application) site: NovelSite,
    pub(in crate::application) site_id: &'a str,
    pub(in crate::application) description: &'a str,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

#[derive(AsChangeset)]
#[diesel(table_name = author)]
pub(in crate::application) struct UpdateAuthorModel<'a> {
    pub(in crate::application) id: i64,
    pub(in crate::application) name: Option<&'a str>,
    pub(in crate::application) avatar: Option<&'a str>,
    pub(in crate::application) description: Option<&'a str>,
    pub(in crate::application) update_time: OffsetDateTime,
}

impl UpdateAuthorModel<'_> {
    pub(in crate::application) fn update(&self, conn: &mut PgConnection) -> AppResult<AuthorModel> {
        let author = diesel::update(author::table.filter(author::id.eq(self.id)))
            .set(self)
            .get_result(conn)?;
        Ok(author)
    }
}
