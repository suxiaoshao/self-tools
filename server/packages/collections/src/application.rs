mod collection;
pub(crate) mod input;
mod item;
mod repository;
#[cfg(test)]
mod tests;

use crate::errors::*;
pub(crate) use collection::Collection;
use input::{CollectionItemQuery, ItemAndCollection};
pub(crate) use item::Item;
use repository::{collection::CollectionModel, item::ItemModel};
use service_db::{Database, PgPool};
use service_query::{PageRange, Paginate, TagFilter};
use std::sync::Arc;

pub(crate) struct Application {
    database: Database,
    auth: thrift::AuthEndpoint,
}

fn auth_endpoint() -> thrift::AuthEndpoint {
    thrift::AuthEndpoint::new(
        "auth:80".into(),
        service_health::budget::AUTH_DNS,
        service_health::budget::AUTH_RPC,
    )
}

impl Application {
    pub(crate) fn connect() -> anyhow::Result<Arc<Self>> {
        let pool = repository::get_pool()
            .map_err(|_| anyhow::anyhow!("collections database unavailable"))?;
        service_health::database::check(
            &mut *pool
                .get()
                .map_err(|_| anyhow::anyhow!("database unavailable"))?,
            crate::MIGRATIONS,
        )?;
        Ok(Self::new(pool, auth_endpoint()))
    }
    fn new(pool: PgPool, auth: thrift::AuthEndpoint) -> Arc<Self> {
        Arc::new(Self {
            database: Database::new(pool),
            auth,
        })
    }
    pub(crate) async fn authenticate(
        &self,
        token: String,
    ) -> Result<(), service_errors::PublicError> {
        self.auth.authenticate(token).await
    }
    async fn database_ready(&self) -> bool {
        matches!(
            tokio::time::timeout(
                service_health::budget::DATABASE,
                self.database.run("collections_ready", |conn| {
                    service_health::database::check(conn, crate::MIGRATIONS).map_err(|e| {
                        service_errors::Fault {
                            kind: service_errors::FaultKind::Database,
                            operation: "collections_schema",
                            source: e.into(),
                        }
                    })
                })
            )
            .await,
            Ok(Ok(()))
        )
    }
    pub(crate) async fn ready(&self) -> bool {
        let (database, auth) = tokio::join!(self.database_ready(), self.auth.ready());
        database && auth
    }
    pub(crate) async fn all_collections(&self) -> AppResult<Vec<Collection>> {
        self.database
            .run("all_collections", Collection::all_collections)
            .await
    }
    pub(crate) async fn get_collection(&self, id: i64) -> AppResult<Option<Collection>> {
        self.database
            .run("get_collection", move |c| detail(Collection::get(id, c)))
            .await
    }
    pub(crate) async fn get_item(&self, id: i64) -> AppResult<Option<Item>> {
        self.database
            .run("get_item", move |c| detail(Item::get(id, c)))
            .await
    }

    pub(crate) async fn create_collection(
        &self,
        name: String,
        parent: Option<i64>,
        description: Option<String>,
    ) -> AppResult<Collection> {
        self.database
            .run("create_collection", move |c| {
                Collection::create(&name, parent, description, c)
            })
            .await
    }
    pub(crate) async fn update_collection(
        &self,
        id: i64,
        name: String,
        description: Option<String>,
    ) -> AppResult<Collection> {
        self.database
            .run("update_collection", move |c| {
                Collection::update(id, &name, description.as_deref(), c)
            })
            .await
    }
    pub(crate) async fn delete_collection(&self, id: i64) -> AppResult<i64> {
        self.database
            .run("delete_collection", move |c| Collection::delete(id, c))
            .await
    }
    pub(crate) async fn create_item(
        &self,
        name: String,
        content: String,
        collections: Vec<i64>,
    ) -> AppResult<Item> {
        self.database
            .run("create_item", move |c| {
                Item::create(name, content, collections, c)
            })
            .await
    }
    pub(crate) async fn update_item(
        &self,
        id: i64,
        name: String,
        content: String,
    ) -> AppResult<Item> {
        self.database
            .run("update_item", move |c| Item::update(id, &name, &content, c))
            .await
    }
    pub(crate) async fn delete_item(&self, id: i64) -> AppResult<i64> {
        self.database
            .run("delete_item", move |c| Item::delete(id, c))
            .await
    }
    pub(crate) async fn add_collection_for_item(
        &self,
        collection: i64,
        item: i64,
    ) -> AppResult<()> {
        self.database
            .run("add_collection_for_item", move |c| {
                Item::add_collection(collection, item, c)
            })
            .await
    }
    pub(crate) async fn delete_collection_for_item(
        &self,
        collection: i64,
        item: i64,
    ) -> AppResult<()> {
        self.database
            .run("delete_collection_for_item", move |c| {
                Item::delete_collection(collection, item, c)
            })
            .await
    }
    pub(crate) async fn query_items(
        &self,
        filter: Option<TagFilter>,
        page: PageRange,
    ) -> AppResult<(Vec<Item>, i64)> {
        self.database
            .run("query_items", move |c| {
                c.build_transaction()
                    .read_only()
                    .repeatable_read()
                    .run(|c| repository::query::page(filter, page, c))
            })
            .await
    }
    pub(crate) async fn collection_and_item(
        &self,
        query: CollectionItemQuery,
    ) -> AppResult<(Vec<ItemAndCollection>, i64)> {
        self.database
            .run("collection_and_item", move |c| {
                c.build_transaction()
                    .read_only()
                    .repeatable_read()
                    .run(|c| {
                        let CollectionItemQuery {
                            id,
                            create_time,
                            update_time,
                            pagination,
                        } = query;
                        if let Some(id) = id {
                            validate_id(id, "query.id")?;
                            if !CollectionModel::exists(id, c)? {
                                return Err(missing(ResourceKind::Collection, id));
                            }
                        }
                        let collections =
                            CollectionModel::get_count_by_parent(id, create_time, update_time, c)?;
                        let items = match id {
                            Some(id) => ItemModel::count(id, create_time, update_time, c)?,
                            None => 0,
                        };
                        let offset = pagination.offset();
                        let limit = pagination.limit();
                        let mut data = Vec::new();
                        if offset < collections {
                            data.extend(
                                CollectionModel::list_parent_with_page(
                                    id,
                                    create_time,
                                    update_time,
                                    offset,
                                    limit.min(collections - offset),
                                    c,
                                )?
                                .into_iter()
                                .map(|v| ItemAndCollection::Collection(v.into())),
                            );
                        }
                        let remaining = limit - data.len() as i64;
                        if remaining > 0
                            && let Some(id) = id
                        {
                            data.extend(
                                ItemModel::query(
                                    id,
                                    create_time,
                                    update_time,
                                    (offset - collections).max(0),
                                    remaining,
                                    c,
                                )?
                                .into_iter()
                                .map(|v| ItemAndCollection::Item(v.into())),
                            );
                        }
                        Ok((data, collections + items))
                    })
            })
            .await
    }
}

fn detail<T>(result: AppResult<T>) -> AppResult<Option<T>> {
    match result {
        Ok(value) => Ok(Some(value)),
        Err(service_errors::UseCaseError::Rejected(Rejection::Missing(_))) => Ok(None),
        Err(error) => Err(error),
    }
}

pub(crate) mod read;
