use crate::{
    application::repository::{collection::CollectionModel, collection_item::CollectionItemModel},
    errors::*,
};
use diesel::{Connection, PgConnection, RunQueryDsl};

use time::OffsetDateTime;
#[derive(Clone)]
pub(crate) struct Collection {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub parent_id: Option<i64>,
    pub description: Option<String>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
impl From<CollectionModel> for Collection {
    fn from(v: CollectionModel) -> Self {
        Self {
            id: v.id,
            name: v.name,
            path: v.path,
            parent_id: v.parent_id,
            description: v.description,
            create_time: v.create_time,
            update_time: v.update_time,
        }
    }
}
/// Serialize hierarchy changes: parent_id has no foreign key and paths must change atomically.
fn lock_tree(conn: &mut PgConnection) -> AppResult<()> {
    diesel::sql_query("LOCK TABLE collection IN SHARE ROW EXCLUSIVE MODE").execute(conn)?;
    Ok(())
}
impl Collection {
    pub(super) fn create(
        name: &str,
        parent_id: Option<i64>,
        description: Option<String>,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        validate_name(name)?;
        if let Some(id) = parent_id {
            validate_id(id, "parentId")?;
        }
        conn.transaction(|conn| {
            lock_tree(conn)?;
            let hierarchy = CollectionModel::hierarchy(conn)?;
            let path = hierarchy.child_path(parent_id, name)?;
            hierarchy.check_name(parent_id, name, None)?;
            if CollectionModel::exists_by_path(&path, conn)? {
                return Err(conflict(ConflictReason::CollectionPathExists, vec![]));
            }
            Ok(CollectionModel::create(name, &path, parent_id, description, conn)?.into())
        })
        .map_err(path_conflict)
    }
    pub(super) fn all_collections(conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        Ok(CollectionModel::get_list(conn)?
            .into_iter()
            .map(Into::into)
            .collect())
    }
    pub(super) fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        validate_id(id, "id")?;
        if !CollectionModel::exists(id, conn)? {
            return Err(missing(ResourceKind::Collection, id));
        }
        Ok(CollectionModel::find_one(id, conn)?.into())
    }
    pub(super) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        validate_id(id, "id")?;
        conn.transaction(|conn| {
            lock_tree(conn)?;
            let ids = CollectionModel::hierarchy(conn)?.subtree(id)?;
            for id in ids.into_iter().rev() {
                CollectionItemModel::delete_by_collection_id(id, conn)?;
                CollectionModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
    pub(super) fn update(
        id: i64,
        name: &str,
        description: Option<&str>,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        validate_id(id, "id")?;
        validate_name(name)?;
        conn.transaction(|conn| {
            lock_tree(conn)?;
            let hierarchy = CollectionModel::hierarchy(conn)?;
            let old = hierarchy.get(id)?;
            let ids = hierarchy.subtree(old.id)?;
            let parent_id = old.parent_id;
            let changes = hierarchy.paths(&ids, name, parent_id)?;
            let path = hierarchy.child_path(parent_id, name)?;
            for change in &changes {
                CollectionModel::set_path(change.id, &change.temporary, conn)?;
            }
            for change in &changes {
                CollectionModel::set_path(change.id, &change.path, conn)?;
            }
            Ok(CollectionModel::update(id, name, description, &path, conn)?.into())
        })
        .map_err(path_conflict)
    }
}
