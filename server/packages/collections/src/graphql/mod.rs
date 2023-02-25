use ::middleware::Logger;
use async_graphql::{EmptySubscription, Schema};

use self::{mutation::MutationRoot, query::QueryRoot};

mod mutation;
mod query;
mod types;
mod validator;
pub type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
mod guard;
mod middleware;

pub fn get_schema() -> RootSchema {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .extension(Logger)
        .finish()
}
