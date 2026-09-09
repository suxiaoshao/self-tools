use super::error::read_error;
use crate::application::{self, Application};
use async_graphql::{
    Context, Request, Result, ServerResult, async_trait,
    dataloader::{DataLoader, HashMapCache, Loader},
    extensions::{Extension, ExtensionContext, ExtensionFactory, NextPrepareRequest},
};
use std::{collections::HashMap, sync::Arc};
use tracing::Instrument;
pub(super) struct Backend(Arc<Application>);
pub(super) struct RequestLoaders(pub Arc<Application>);
struct PerRequest(Arc<DataLoader<Backend, HashMapCache>>);
impl ExtensionFactory for RequestLoaders {
    fn create(&self) -> Arc<dyn Extension> {
        Arc::new(PerRequest(Arc::new(DataLoader::with_cache(
            Backend(self.0.clone()),
            |f| tokio::spawn(f.in_current_span()),
            HashMapCache::default(),
        ))))
    }
}
#[async_trait::async_trait]
impl Extension for PerRequest {
    async fn prepare_request(
        &self,
        _ctx: &ExtensionContext<'_>,
        mut request: Request,
        _next: NextPrepareRequest<'_>,
    ) -> ServerResult<Request> {
        let name = request.operation_name.clone();
        let doc = request.parsed_query().map_err(|_| {
            graphql_common::code_error(service_errors::PublicCode::InvalidRequest)
                .into_server_error(Default::default())
        })?;
        let op = if let Some(name) = name {
            doc.operations
                .iter()
                .find(|(n, _)| n.is_some_and(|n| n.as_str() == name))
        } else if doc.operations.iter().len() == 1 {
            doc.operations.iter().next()
        } else {
            None
        };
        let cache = op
            .is_some_and(|(_, o)| o.node.ty == async_graphql::parser::types::OperationType::Query);
        self.0.enable_all_cache(cache);
        _next
            .run(_ctx, request.data(self.0.clone()).data(CacheEnabled(cache)))
            .await
    }
}
struct CacheEnabled(bool);
pub(super) trait Key: Send + Sync + Eq + std::hash::Hash + Clone + 'static {
    type Value: Send + Sync + Clone + 'static;
}
macro_rules! loader {
    ($key:ident, $value:ty, $method:ident) => {
        #[derive(Clone, Copy, Eq, PartialEq, Hash)]
        pub(super) struct $key(pub i64);
        impl Key for $key {
            type Value = $value;
        }
        impl Loader<$key> for Backend {
            type Value = Result<Option<$value>>;
            type Error = std::convert::Infallible;
            async fn load(
                &self,
                keys: &[$key],
            ) -> std::result::Result<HashMap<$key, Self::Value>, Self::Error> {
                // Store missing values and safe errors too: prefetch must not turn a field fault
                // into a root failure or cause an automatic second database read.
                let result = self
                    .0
                    .$method(keys.iter().map(|k| k.0).collect())
                    .await
                    .map_err(read_error);
                Ok(match result {
                    Ok(mut values) => keys.iter().map(|k| (*k, Ok(values.remove(&k.0)))).collect(),
                    Err(error) => keys.iter().map(|k| (*k, Err(error.clone()))).collect(),
                })
            }
        }
    };
}
loader!(
    ItemCollections,
    Vec<Arc<application::Collection>>,
    batch_item_collections
);
loader!(Ancestors, application::read::Ancestry, batch_ancestors);
pub(super) async fn load<K: Key>(ctx: &Context<'_>, key: K) -> Result<Option<K::Value>>
where
    Backend: Loader<K, Value = Result<Option<K::Value>>, Error = std::convert::Infallible>,
{
    let loader = ctx
        .data_opt::<Arc<DataLoader<Backend, HashMapCache>>>()
        .ok_or_else(|| {
            graphql_common::fault_error(service_errors::Fault::internal("graphql_loaders"))
        })?;
    match loader.load_one(key).await {
        Ok(Some(value)) => value,
        Ok(None) => Ok(None),
        Err(never) => match never {},
    }
}
pub(super) async fn prefetch<K: Key>(ctx: &Context<'_>, keys: impl IntoIterator<Item = K>)
where
    Backend: Loader<K, Value = Result<Option<K::Value>>, Error = std::convert::Infallible>,
{
    if ctx.data_opt::<CacheEnabled>().is_some_and(|v| v.0)
        && let Some(loader) = ctx.data_opt::<Arc<DataLoader<Backend, HashMapCache>>>()
    {
        let _ = loader.load_many(keys).await;
    }
}
pub(super) async fn ancestors(
    ctx: &Context<'_>,
    id: i64,
) -> Result<Vec<Arc<application::Collection>>> {
    match load(ctx, Ancestors(id)).await? {
        Some(application::read::Ancestry::Found(v)) => Ok(v),
        Some(application::read::Ancestry::Missing(id)) => Err(read_error(crate::errors::missing(
            crate::errors::ResourceKind::Collection,
            id,
        ))),
        _ => Err(graphql_common::fault_error(
            service_errors::Fault::internal("collection_ancestors"),
        )),
    }
}
