use std::collections::{HashMap, HashSet};

use crate::{errors::GraphqlResult, model::schema::collection_item};
use diesel::{
    ExpressionMethods, PgConnection, QueryDsl, RunQueryDsl,
    prelude::{Insertable, Queryable},
};

#[derive(Queryable, Insertable)]
#[diesel(table_name = collection_item)]
pub(crate) struct CollectionItemModel {
    pub(crate) collection_id: i64,
    pub(crate) item_id: i64,
}

impl CollectionItemModel {
    pub(crate) fn save(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        diesel::insert_into(collection_item::table)
            .values(CollectionItemModel {
                collection_id,
                item_id,
            })
            .execute(conn)?;
        Ok(())
    }
    /// 根据 collection_id 删除记录
    pub(crate) fn delete_by_collection_id(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let deleted = diesel::delete(
            collection_item::table.filter(collection_item::collection_id.eq(collection_id)),
        )
        .execute(conn)?;
        Ok(deleted)
    }
    /// 根据 item_id 删除记录
    pub(crate) fn delete_by_item_id(item_id: i64, conn: &mut PgConnection) -> GraphqlResult<usize> {
        let deleted =
            diesel::delete(collection_item::table.filter(collection_item::item_id.eq(item_id)))
                .execute(conn)?;
        Ok(deleted)
    }
    pub(crate) fn map_collection_item(
        conn: &mut PgConnection,
    ) -> GraphqlResult<HashMap<i64, HashSet<i64>>> {
        let all_data = collection_item::table
            .select((collection_item::collection_id, collection_item::item_id))
            .get_results::<(i64, i64)>(conn)?;
        // 构建一个 `id` 到其子节点列表的映射
        let mut lookup: HashMap<i64, HashSet<i64>> = HashMap::new();
        for (collection_id, item_id) in all_data {
            lookup.entry(collection_id).or_default().insert(item_id);
        }
        Ok(lookup)
    }
    pub(crate) fn map_item_collection(
        conn: &mut PgConnection,
    ) -> GraphqlResult<HashMap<i64, HashSet<i64>>> {
        let all_data = collection_item::table
            .select((collection_item::collection_id, collection_item::item_id))
            .get_results::<(i64, i64)>(conn)?;
        // 构建一个 `id` 到其子节点列表的映射
        let mut lookup: HashMap<i64, HashSet<i64>> = HashMap::new();
        for (collection_id, item_id) in all_data {
            lookup.entry(item_id).or_default().insert(collection_id);
        }
        Ok(lookup)
    }
    pub(crate) fn exists(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection_item::table
                .filter(collection_item::collection_id.eq(collection_id))
                .filter(collection_item::item_id.eq(item_id)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
    pub(crate) fn delete(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        diesel::delete(collection_item::table)
            .filter(collection_item::collection_id.eq(collection_id))
            .filter(collection_item::item_id.eq(item_id))
            .execute(conn)?;
        Ok(())
    }
}
