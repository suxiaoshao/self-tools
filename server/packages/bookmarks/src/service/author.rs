/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 19:55:16
 * @FilePath: /self-tools/server/packages/bookmarks/src/service/author.rs
 */
use async_graphql::{ComplexObject, Context, SimpleObject};
use diesel::PgConnection;
use time::OffsetDateTime;
use tracing::{event, Level};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::{author::AuthorModel, novel::NovelModel, schema::custom_type::NovelSite, PgPool},
};

use super::novel::Novel;

#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Author {
    pub id: i64,
    pub name: String,
    pub avatar: String,
    pub site: NovelSite,
    pub site_id: String,
    pub description: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

#[ComplexObject]
impl Author {
    async fn novels(&self, context: &Context<'_>) -> GraphqlResult<Vec<Novel>> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let novels = NovelModel::query_by_author_id(self.id, conn)?;
        Ok(novels.into_iter().map(|x| x.into()).collect())
    }
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

impl Author {
    /// 创建作者
    pub fn create(
        name: &str,
        avatar: &str,
        description: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let new_author = AuthorModel::create(name, avatar, site, site_id, description, conn)?;
        Ok(new_author.into())
    }
    /// 删除作者
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(id, conn)? {
            event!(Level::WARN, "作者不存在: {}", id);
            return Err(GraphqlError::NotFound("作者", id));
        }
        conn.build_transaction().run(|conn| {
            let deleted_author = AuthorModel::delete(id, conn)?;
            NovelModel::delete_by_author_id(id, conn)?;
            // todo delete chapters
            Ok(deleted_author.into())
        })
    }
    /// 获取作者列表
    pub fn query(search_name: Option<String>, conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let authors = match search_name {
            Some(search_name) => AuthorModel::get_search_list(search_name, conn)?,
            None => AuthorModel::get_list(conn)?,
        };
        Ok(authors.into_iter().map(|x| x.into()).collect())
    }
    /// 获取作者
    pub fn get(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(id, conn)? {
            event!(Level::WARN, "作者不存在: {}", id);
            return Err(GraphqlError::NotFound("作者", id));
        }
        let author = AuthorModel::get(id, conn)?;
        Ok(author.into())
    }
}
