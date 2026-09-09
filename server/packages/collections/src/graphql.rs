/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 07:33:34
 * @FilePath: /self-tools/server/packages/collections/src/graphql/mod.rs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
use ::middleware::Logger;
use async_graphql::{EmptySubscription, Schema};

use crate::application::Application;
use std::sync::Arc;

use self::{mutation::MutationRoot, query::QueryRoot};

mod error;
mod loaders;
pub(crate) mod mutation;
pub(crate) mod query;
pub(crate) mod types;
pub(crate) type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
mod guard;

pub(crate) fn schema_builder()
-> async_graphql::SchemaBuilder<QueryRoot, MutationRoot, EmptySubscription> {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .extension(Logger)
        .extension(graphql_common::cost::RequestLimits)
        .limit_depth(graphql_common::cost::MAX_INTROSPECTION_DEPTH)
        .limit_complexity(graphql_common::cost::MAX_COMPLEXITY)
}
pub(crate) fn get_schema(application: Arc<Application>) -> RootSchema {
    schema_builder()
        .extension(loaders::RequestLoaders(application.clone()))
        .data(application)
        .finish()
}

pub(crate) fn schema_sdl() -> String {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .finish()
        .sdl()
}
