use crate::{
    errors::*,
    model::{PgPool, collection::CollectionModel, collection_novel::CollectionNovelModel},
};
use diesel::PgConnection;
use service_query::Queryable;
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
    pub fn create(
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
    pub fn all_collections(conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        Ok(CollectionModel::get_list(conn)?
            .into_iter()
            .map(Into::into)
            .collect())
    }
    pub fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        validate_id(id, "id")?;
        if !CollectionModel::exists(id, conn)? {
            return Err(missing(ResourceKind::Collection, id));
        }
        Ok(CollectionModel::find_one(id, conn)?.into())
    }
    pub fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
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
    pub fn get_ancestors(id: i64, conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let mut parent = Self::get(id, conn)?.parent_id;
        let mut result = vec![];
        let mut seen = std::collections::HashSet::from([id]);
        while let Some(id) = parent {
            if !seen.insert(id) {
                return Err(service_errors::Fault::internal("collection_ancestors").into());
            }
            let item = Self::get(id, conn)?;
            parent = item.parent_id;
            result.push(item);
        }
        result.reverse();
        Ok(result)
    }
    pub fn update(
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

impl Collection {
    pub fn many_by_novel_id(novel_id: i64, conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let ids = CollectionNovelModel::many_by_novel_id(novel_id, conn)?;
        Ok(CollectionModel::many_by_ids(&ids, conn)?
            .into_iter()
            .map(Into::into)
            .collect())
    }
    pub fn get_list_parent_id(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        if let Some(id) = parent_id {
            Self::get(id, conn)?;
        }
        Ok(CollectionModel::get_list_by_parent(parent_id, conn)?
            .into_iter()
            .map(Into::into)
            .collect())
    }
}
pub(crate) struct CollectionRunner {
    conn: PgPool,
    count: i64,
    parent_id: Option<i64>,
}

impl CollectionRunner {
    pub(crate) fn new(conn: PgPool, parent_id: Option<i64>) -> AppResult<Self> {
        let conn_temp = &mut conn.get()?;
        if let Some(id) = parent_id {
            validate_id(id, "parentId")?;
            Collection::get(id, conn_temp)?;
        }
        let count = CollectionModel::get_count(parent_id, conn_temp)?;
        Ok(Self {
            conn,
            count,
            parent_id,
        })
    }
}

impl Queryable for CollectionRunner {
    type Item = Collection;

    type Error = AppError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: service_query::Paginate>(
        &self,
        pagination: P,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();

        let limit = pagination.limit();
        let conn = &mut self.conn.get()?;
        //  判断父目录是否存在
        if let Some(id) = self.parent_id
            && !CollectionModel::exists(id, conn)?
        {
            return Err(crate::errors::missing(
                crate::errors::ResourceKind::Collection,
                id,
            ));
        }
        let collections =
            CollectionModel::list_by_parent_with_page(self.parent_id, offset, limit, conn)?;
        Ok(collections.into_iter().map(Into::into).collect())
    }
}
