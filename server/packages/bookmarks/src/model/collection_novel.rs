use crate::{errors::GraphqlResult, model::schema::collection_novel};
use diesel::prelude::*;
use std::collections::{HashMap, HashSet};

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
        collection_id: &HashSet<i64>,
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
    pub(crate) fn map_novel_collection(
        conn: &mut PgConnection,
    ) -> GraphqlResult<HashMap<i64, HashSet<i64>>> {
        let all_data = collection_novel::table
            .select((collection_novel::collection_id, collection_novel::novel_id))
            .get_results::<(i64, i64)>(conn)?;
        // 构建一个 `id` 到其子节点列表的映射
        let mut lookup: HashMap<i64, HashSet<i64>> = HashMap::new();
        for (collection_id, novel_id) in all_data {
            lookup.entry(novel_id).or_default().insert(collection_id);
        }
        Ok(lookup)
    }
    pub(crate) fn map_collection_novel(
        conn: &mut PgConnection,
    ) -> GraphqlResult<HashMap<i64, HashSet<i64>>> {
        let all_data = collection_novel::table
            .select((collection_novel::collection_id, collection_novel::novel_id))
            .get_results::<(i64, i64)>(conn)?;
        // 构建一个 `id` 到其子节点列表的映射
        let mut lookup: HashMap<i64, HashSet<i64>> = HashMap::new();
        for (collection_id, novel_id) in all_data {
            lookup.entry(collection_id).or_default().insert(novel_id);
        }
        Ok(lookup)
    }
    pub(crate) fn many_by_novel_id(
        novel_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<i64>> {
        let data = collection_novel::table
            .select(collection_novel::collection_id)
            .filter(collection_novel::novel_id.eq(novel_id))
            .get_results(conn)?;
        Ok(data)
    }
}
