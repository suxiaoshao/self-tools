use async_graphql::{EmptySubscription, Schema};

use self::{mutation::MutationRoot, query::QueryRoot};

pub mod mutation;
pub mod query;
pub type RootSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
