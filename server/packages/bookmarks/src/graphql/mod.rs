/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 18:34:02
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/mod.rs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
use async_graphql::{EmptySubscription, Schema};
use middleware::Logger;

use self::{mutation::MutationRoot, query::QueryRoot};

mod guard;
pub mod input;
mod mutation;
mod query;
mod validator;
pub type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;

pub fn get_schema() -> RootSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .extension(Logger)
        .finish()
}
