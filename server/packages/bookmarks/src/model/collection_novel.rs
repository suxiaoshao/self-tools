use diesel::prelude::*;

use crate::{errors::GraphqlResult, model::schema::collection_novel};

#[derive(Queryable, Insertable)]
#[diesel(table_name = collection_novel)]
pub(crate) struct CollectionNovelModel {
    pub(crate) collection_id: i64,
    pub(crate) novel_id: i64,
}

impl CollectionNovelModel {
    pub(crate) fn save(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        let model = Self {
            collection_id,
            novel_id,
        };
        diesel::insert_into(collection_novel::table)
            .values(model)
            .execute(conn)?;
        Ok(())
    }
    pub(crate) fn delete(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
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
    pub(crate) fn exists(
        collection_id: i64,
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<bool> {
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
    pub(crate) fn delete_by_collection_ids(
        collection_id: &[i64],
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        diesel::delete(
            collection_novel::table.filter(collection_novel::collection_id.eq_any(collection_id)),
        )
        .execute(conn)?;
        Ok(())
    }
    pub(crate) fn delete_by_novel_id(novel_id: i64, conn: &mut PgConnection) -> GraphqlResult<()> {
        diesel::delete(collection_novel::table.filter(collection_novel::novel_id.eq(novel_id)))
            .execute(conn)?;
        Ok(())
    }
    pub(crate) fn delete_by_novel_ids(
        novel_id: &[i64],
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        diesel::delete(collection_novel::table.filter(collection_novel::novel_id.eq_any(novel_id)))
            .execute(conn)?;
        Ok(())
    }
}
