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

use self::{mutation::MutationRoot, query::QueryRoot};

mod mutation;
mod query;
pub(crate) mod types;
mod validator;
pub(crate) type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
mod guard;
mod middleware;

pub(crate) fn get_schema() -> RootSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .extension(Logger)
        .finish()
}
