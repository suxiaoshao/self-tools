use crate::{application::repository::schema::collection_item, errors::AppResult};
use diesel::{
    ExpressionMethods, PgConnection, QueryDsl, RunQueryDsl,
    prelude::{Insertable, Queryable},
};

#[derive(Queryable, Insertable)]
#[diesel(table_name = collection_item)]
pub(in crate::application) struct CollectionItemModel {
    pub(in crate::application) collection_id: i64,
    pub(in crate::application) item_id: i64,
}

impl CollectionItemModel {
    pub(in crate::application) fn save(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        diesel::insert_into(collection_item::table)
            .values(CollectionItemModel {
                collection_id,
                item_id,
            })
            .execute(conn)?;
        Ok(())
    }
    /// 根据 collection_id 删除记录
    pub(in crate::application) fn delete_by_collection_id(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<usize> {
        let deleted = diesel::delete(
            collection_item::table.filter(collection_item::collection_id.eq(collection_id)),
        )
        .execute(conn)?;
        Ok(deleted)
    }
    /// 根据 item_id 删除记录
    pub(in crate::application) fn delete_by_item_id(
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<usize> {
        let deleted =
            diesel::delete(collection_item::table.filter(collection_item::item_id.eq(item_id)))
                .execute(conn)?;
        Ok(deleted)
    }

    pub(in crate::application) fn exists(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection_item::table
                .filter(collection_item::collection_id.eq(collection_id))
                .filter(collection_item::item_id.eq(item_id)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
    pub(in crate::application) fn delete(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        diesel::delete(collection_item::table)
            .filter(collection_item::collection_id.eq(collection_id))
            .filter(collection_item::item_id.eq(item_id))
            .execute(conn)?;
        Ok(())
    }
}
