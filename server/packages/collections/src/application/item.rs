use crate::{
    application::repository::{
        collection::CollectionModel, collection_item::CollectionItemModel, item::ItemModel,
    },
    errors::*,
};
use diesel::{Connection, PgConnection, RunQueryDsl};
use time::OffsetDateTime;
#[derive(Clone)]
pub(crate) struct Item {
    pub id: i64,
    pub name: String,
    pub content: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
impl From<ItemModel> for Item {
    fn from(v: ItemModel) -> Self {
        Self {
            id: v.id,
            name: v.name,
            content: v.content,
            create_time: v.create_time,
            update_time: v.update_time,
        }
    }
}
fn lock_relations(conn: &mut PgConnection) -> AppResult<()> {
    diesel::sql_query("LOCK TABLE collection, item, collection_item IN SHARE ROW EXCLUSIVE MODE")
        .execute(conn)?;
    Ok(())
}
impl Item {
    pub(super) fn create(
        name: String,
        content: String,
        mut collection_ids: Vec<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        for (index, id) in collection_ids.iter().enumerate() {
            validate_id(*id, &format!("collectionIds.{index}"))?;
        }
        collection_ids.sort_unstable();
        collection_ids.dedup();
        conn.transaction(|conn| {
            lock_relations(conn)?;
            let mut resources = vec![];
            for id in &collection_ids {
                if !CollectionModel::exists(*id, conn)? {
                    resources.push(ResourceRef {
                        kind: ResourceKind::Collection,
                        id: *id,
                    });
                }
            }
            if !resources.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    resources,
                )));
            }
            let item = ItemModel::create(&name, &content, conn)?;
            if !collection_ids.is_empty() {
                item.add_collections(&collection_ids, conn)?;
            }
            Ok(item.into())
        })
    }
    pub(super) fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        validate_id(id, "id")?;
        if !ItemModel::exists(id, conn)? {
            return Err(missing(ResourceKind::Item, id));
        }
        Ok(ItemModel::find_one(id, conn)?.into())
    }
    pub(super) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        validate_id(id, "id")?;
        conn.transaction(|conn| {
            lock_relations(conn)?;
            if ItemModel::exists(id, conn)? {
                CollectionItemModel::delete_by_item_id(id, conn)?;
                ItemModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
    pub(super) fn update(
        id: i64,
        name: &str,
        content: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        validate_id(id, "id")?;
        conn.transaction(|conn| {
            lock_relations(conn)?;
            Self::get(id, conn)?;
            Ok(ItemModel::update(id, name, content, conn)?.into())
        })
    }

    pub(super) fn add_collection(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        validate_id(collection_id, "collectionId")?;
        validate_id(item_id, "itemId")?;
        conn.transaction(|conn| {
            lock_relations(conn)?;
            let mut resources = vec![];
            if !CollectionModel::exists(collection_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Collection,
                    id: collection_id,
                });
            }
            if !ItemModel::exists(item_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Item,
                    id: item_id,
                });
            }
            if !resources.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    resources,
                )));
            }
            if CollectionItemModel::exists(collection_id, item_id, conn)? {
                return Err(conflict(
                    ConflictReason::MembershipExists,
                    vec![
                        ResourceRef {
                            kind: ResourceKind::Collection,
                            id: collection_id,
                        },
                        ResourceRef {
                            kind: ResourceKind::Item,
                            id: item_id,
                        },
                    ],
                ));
            }
            CollectionItemModel::save(collection_id, item_id, conn)
        })
    }
    pub(super) fn delete_collection(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        validate_id(collection_id, "collectionId")?;
        validate_id(item_id, "itemId")?;
        CollectionItemModel::delete(collection_id, item_id, conn)
    }
}
