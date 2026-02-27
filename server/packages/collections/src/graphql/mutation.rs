/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-20 16:24:35
 * @FilePath: /self-tools/server/packages/collections/src/graphql/mutation.rs
 */
use async_graphql::{Context, Object};
use tracing::{Level, event};

use super::{guard::AuthGuard, validator::DirNameValidator};
use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::PgPool,
    service::{collection::Collection, item::Item},
};

pub(crate) struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    #[graphql(guard = "AuthGuard")]
    async fn create_collection(
        &self,
        context: &Context<'_>,
        #[graphql(validator(custom = "DirNameValidator"))] name: String,
        parent_id: Option<i64>,
        description: Option<String>,
    ) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let new_directory = Collection::create(&name, parent_id, description, conn)?;
        Ok(new_directory)
    }
    /// 删除目录
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let deleted_directory = Collection::delete(id, conn)?;
        Ok(deleted_directory)
    }
    /// 修改目录
    #[graphql(guard = "AuthGuard")]
    async fn update_collection(
        &self,
        context: &Context<'_>,
        id: i64,
        name: String,
        description: Option<String>,
    ) -> GraphqlResult<Collection> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let updated_directory = Collection::update(id, &name, description.as_deref(), conn)?;
        Ok(updated_directory)
    }
    /// 创建记录
    #[graphql(guard = "AuthGuard")]
    async fn create_item(
        &self,
        context: &Context<'_>,
        name: String,
        content: String,
        collection_ids: Vec<i64>,
    ) -> GraphqlResult<Item> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let created_item = Item::create(name, content, collection_ids, conn)?;
        Ok(created_item)
    }
    /// 删除记录
    #[graphql(guard = "AuthGuard")]
    async fn delete_item(&self, context: &Context<'_>, id: i64) -> GraphqlResult<Item> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let deleted_item = Item::delete(id, conn)?;
        Ok(deleted_item)
    }
    /// 修改记录
    #[graphql(guard = "AuthGuard")]
    async fn update_item(
        &self,
        context: &Context<'_>,
        id: i64,
        name: String,
        content: String,
    ) -> GraphqlResult<Item> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        let updated_item = Item::update(id, &name, &content, conn)?;
        Ok(updated_item)
    }
    /// 给条目添加集合
    #[graphql(guard = "AuthGuard")]
    async fn add_collection_for_item(
        &self,
        context: &Context<'_>,
        collection_id: i64,
        item_id: i64,
    ) -> GraphqlResult<Item> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        Item::add_collection(collection_id, item_id, conn)
    }
    /// 给条目删除集合
    #[graphql(guard = "AuthGuard")]
    async fn delete_collection_for_item(
        &self,
        context: &Context<'_>,
        collection_id: i64,
        item_id: i64,
    ) -> GraphqlResult<Item> {
        let conn = &mut context
            .data::<PgPool>()
            .map_err(|_| {
                event!(Level::WARN, "graphql context data PgPool 不存在");
                GraphqlError::NotGraphqlContextData("PgPool")
            })?
            .get()?;
        Item::delete_collection(collection_id, item_id, conn)
    }
}
