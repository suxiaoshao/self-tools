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
            let path = match parent_id {
                None => format!("/{name}/"),
                Some(id) => format!("{}{name}/", Self::get(id, conn)?.path),
            };
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
            Self::delete_inner(id, conn)?;
            Ok(id)
        })
    }
    fn delete_inner(id: i64, conn: &mut PgConnection) -> AppResult<()> {
        if !CollectionModel::exists(id, conn)? {
            return Ok(());
        }
        for child in CollectionModel::get_list_by_parent(Some(id), conn)? {
            Self::delete_inner(child.id, conn)?;
        }
        CollectionNovelModel::delete_by_collection_ids(
            &std::collections::HashSet::from([id]),
            conn,
        )?;
        CollectionModel::delete_list(&std::collections::HashSet::from([id]), conn)?;
        Ok(())
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
            let old = Self::get(id, conn)?;
            if let Some(parent) = parent_id {
                let parent = Self::get(parent, conn)?;
                if parent.id == id || parent.path.starts_with(&old.path) {
                    return Err(invalid(
                        "parentId",
                        service_errors::ValidationCode::InvalidFormat,
                    ));
                }
            }
            let path = match parent_id {
                None => format!("/{name}/"),
                Some(parent) => format!("{}{name}/", Self::get(parent, conn)?.path),
            };
            if path != old.path && CollectionModel::exists_by_path(&path, conn)? {
                return Err(conflict(ConflictReason::CollectionPath, vec![]));
            }
            let updated = CollectionModel::update(id, name, parent_id, description, &path, conn)?;
            if old.path != path {
                // Compare literal prefixes in Rust; user '%' and '_' must not become SQL wildcards.
                for child in CollectionModel::get_list(conn)? {
                    if child.id != id
                        && let Some(suffix) = child.path.strip_prefix(&old.path)
                    {
                        CollectionModel::update(
                            child.id,
                            &child.name,
                            child.parent_id,
                            child.description.as_deref(),
                            &format!("{path}{suffix}"),
                            conn,
                        )?;
                    }
                }
            }
            Ok(updated.into())
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
