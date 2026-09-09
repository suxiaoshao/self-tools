/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-23 21:10:53
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/mod.rs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
use async_graphql::{EmptySubscription, Schema};
use middleware::Logger;

use crate::application::Application;
use std::sync::Arc;

use self::{mutation::MutationRoot, query::QueryRoot};

mod enums;
mod error;
mod guard;
mod input;
pub(crate) mod mutation;
mod objects;
mod output;
pub(crate) mod query;
mod results;
pub(crate) type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

pub(crate) fn get_schema(application: Arc<Application>) -> RootSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .extension(Logger)
        .data(application)
        .finish()
}

pub(crate) fn schema_sdl() -> String {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .finish()
        .sdl()
}
