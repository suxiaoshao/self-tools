use crate::{application::repository::schema::collection_novel, errors::AppResult};
use diesel::prelude::*;
use std::collections::HashSet;

#[derive(Queryable, Insertable)]
#[diesel(table_name = collection_novel)]
pub(in crate::application) struct CollectionNovelModel {
    pub(in crate::application) collection_id: i64,
    pub(in crate::application) novel_id: i64,
}

impl CollectionNovelModel {
    pub(in crate::application) fn save(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        let model = Self {
            collection_id,
            novel_id,
        };
        diesel::insert_into(collection_novel::table)
            .values(model)
            .execute(conn)?;
        Ok(())
    }
    pub(in crate::application) fn delete(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        diesel::delete(
            collection_novel::table.filter(
                collection_novel::collection_id
                    .eq(collection_id)
                    .and(collection_novel::novel_id.eq(novel_id)),
            ),
        )
        .execute(conn)?;
        Ok(())
    }
    pub(in crate::application) fn exists(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection_novel::table.filter(
                collection_novel::collection_id
                    .eq(collection_id)
                    .and(collection_novel::novel_id.eq(novel_id)),
            ),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
    pub(in crate::application) fn delete_by_collection_ids(
        collection_id: &HashSet<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        diesel::delete(
            collection_novel::table.filter(collection_novel::collection_id.eq_any(collection_id)),
        )
        .execute(conn)?;
        Ok(())
    }
    pub(in crate::application) fn delete_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        diesel::delete(collection_novel::table.filter(collection_novel::novel_id.eq(novel_id)))
            .execute(conn)?;
        Ok(())
    }
}
