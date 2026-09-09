use crate::{
    application::repository::{
        collection::CollectionModel, collection_novel::CollectionNovelModel,
    },
    errors::*,
};
use diesel::PgConnection;

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
        super::write(conn, |conn| {
            let hierarchy = CollectionModel::hierarchy(conn)?;
            let path = hierarchy.child_path(parent_id, name)?;
            hierarchy.check_name(parent_id, name, None)?;
            if CollectionModel::exists_by_path(&path, conn)? {
                return Err(conflict(ConflictReason::CollectionPath, vec![]));
            }
            Ok(CollectionModel::create(name, &path, parent_id, description, conn)?.into())
        })
        .map_err(|error| {
            if let service_errors::UseCaseError::Fault(fault) = &error
                && let Some(diesel::result::Error::DatabaseError(
                    diesel::result::DatabaseErrorKind::UniqueViolation,
                    info,
                )) = fault.source.downcast_ref::<diesel::result::Error>()
                && info.constraint_name() == Some("collection_path_key")
            {
                return conflict(ConflictReason::CollectionPath, vec![]);
            }
            error
        })
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
        super::write(conn, |conn| {
            let ids = CollectionModel::hierarchy(conn)?.subtree(id)?;
            for id in ids.into_iter().rev() {
                let ids = std::collections::HashSet::from([id]);
                CollectionNovelModel::delete_by_collection_ids(&ids, conn)?;
                CollectionModel::delete_list(&ids, conn)?;
            }
            Ok(id)
        })
    }
    pub(super) fn update(
        id: i64,
        name: &str,
        parent_id: Option<i64>,
        description: Option<&str>,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        validate_id(id, "id")?;
        validate_name(name)?;
        if let Some(parent) = parent_id {
            validate_id(parent, "parentId")?;
        }
        super::write(conn, |conn| {
            let hierarchy = CollectionModel::hierarchy(conn)?;
            let old = hierarchy.get(id)?;
            let ids = hierarchy.subtree(old.id)?;
            if let Some(parent) = parent_id {
                hierarchy.get(parent)?;
                if ids.contains(&parent) {
                    return Err(invalid(
                        "parentId",
                        service_errors::ValidationCode::InvalidFormat,
                    ));
                }
            }
            let changes = hierarchy.paths(&ids, name, parent_id)?;
            let path = hierarchy.child_path(parent_id, name)?;
            for change in &changes {
                CollectionModel::set_path(change.id, &change.temporary, conn)?;
            }
            for change in &changes {
                CollectionModel::set_path(change.id, &change.path, conn)?;
            }
            Ok(CollectionModel::update(id, name, parent_id, description, &path, conn)?.into())
        })
        .map_err(|error| {
            if let service_errors::UseCaseError::Fault(fault) = &error
                && let Some(diesel::result::Error::DatabaseError(
                    diesel::result::DatabaseErrorKind::UniqueViolation,
                    info,
                )) = fault.source.downcast_ref::<diesel::result::Error>()
                && info.constraint_name() == Some("collection_path_key")
            {
                return conflict(ConflictReason::CollectionPath, vec![]);
            }
            error
        })
    }
}
