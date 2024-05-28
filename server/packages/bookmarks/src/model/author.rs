/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-01 03:54:18
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/author.rs
 */
use crate::errors::GraphqlResult;

use super::schema::{
    author::{self},
    custom_type::NovelSite,
};
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
pub struct AuthorModel {
    pub id: i64,
    pub name: String,
    pub avatar: String,
    pub site: NovelSite,
    pub site_id: String,
    pub description: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// id 相关的操作
impl AuthorModel {
    /// 创建作者
    pub fn create(
        name: &str,
        avatar: &str,
        site: NovelSite,
        site_id: &str,
        description: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
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
    pub fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(author::table.filter(author::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除作者
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let deleted = diesel::delete(author::table.filter(author::id.eq(id))).get_result(conn)?;
        Ok(deleted)
    }
    /// 获取作者
    pub fn get(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let author = author::table.filter(author::id.eq(id)).first(conn)?;
        Ok(author)
    }
}

impl AuthorModel {
    /// 获取所有作者
    pub fn get_list(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let authors = author::table.load(conn)?;
        Ok(authors)
    }
    /// 获取作者搜索列表
    pub fn get_search_list(
        search_name: String,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        let authors = author::table
            .filter(author::name.like(format!("%{search_name}%")))
            .load(conn)?;
        Ok(authors)
    }
}

/// site_id 相关的操作
impl AuthorModel {
    pub fn exists_by_site_id(site_id: &str, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            author::table.filter(author::site_id.eq(site_id)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
}

#[derive(Insertable)]
#[diesel(table_name = author)]
pub struct NewAuthor<'a> {
    pub name: &'a str,
    pub avatar: &'a str,
    pub site: NovelSite,
    pub site_id: &'a str,
    pub description: &'a str,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

#[derive(AsChangeset)]
#[diesel(table_name = author)]
pub struct UpdateAuthorModel<'a> {
    pub id: i64,
    pub name: Option<&'a str>,
    pub avatar: Option<&'a str>,
    pub description: Option<&'a str>,
    pub update_time: OffsetDateTime,
}

impl UpdateAuthorModel<'_> {
    pub fn update(&self, conn: &mut PgConnection) -> GraphqlResult<AuthorModel> {
        let author = diesel::update(author::table.filter(author::id.eq(self.id)))
            .set(self)
            .get_result(conn)?;
        Ok(author)
    }
}
