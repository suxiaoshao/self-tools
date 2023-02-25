use async_graphql::{EmptySubscription, Schema};
use middleware::Logger;

use self::{mutation::MutationRoot, query::QueryRoot};

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
