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

use crate::{errors::GraphqlResult, model::get_pool};

use self::{mutation::MutationRoot, query::QueryRoot};

mod guard;
pub mod input;
mod mutation;
mod output;
mod query;
mod validator;
pub type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

pub fn get_schema() -> GraphqlResult<RootSchema> {
    let pool = get_pool()?;
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .extension(Logger)
        .data(pool)
        .finish();
    Ok(schema)
}
