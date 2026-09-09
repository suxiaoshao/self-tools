use super::schema::collection::{self};
use crate::errors::AppResult;
use diesel::prelude::*;
use std::collections::HashSet;
use time::OffsetDateTime;

#[derive(Queryable, QueryableByName)]
#[diesel(table_name = collection)]
#[cfg_attr(test, derive(Debug))]
pub(in crate::application) struct CollectionModel {
    pub(in crate::application) id: i64,
    pub(in crate::application) name: String,
    pub(in crate::application) path: String,
    pub(in crate::application) parent_id: Option<i64>,
    pub(in crate::application) description: Option<String>,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = collection)]
struct NewCollection<'a> {
    pub(in crate::application) name: &'a str,
    pub(in crate::application) path: &'a str,
    pub(in crate::application) parent_id: Option<i64>,
    pub(in crate::application) description: Option<String>,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

/// id 相关
impl CollectionModel {
    /// 创建目录
    pub(in crate::application) fn create(
        name: &str,
        path: &str,
        parent_id: Option<i64>,
        description: Option<String>,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_collection = NewCollection {
            name,
            path,
            parent_id,
            description,
            create_time: now,
            update_time: now,
        };

        let new_collection = diesel::insert_into(collection::table)
            .values(&new_collection)
            .get_result(conn)?;
        Ok(new_collection)
    }
    /// 判断目录是否存在
    pub(in crate::application) fn exists(id: i64, conn: &mut PgConnection) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::id.eq(id)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
    /// 查找目录
    pub(in crate::application) fn find_one(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let collection = collection::table
            .filter(collection::id.eq(id))
            .first(conn)?;
        Ok(collection)
    }
    /// 根据列表删除目录
    pub(in crate::application) fn delete_list(
        ids: &HashSet<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<usize> {
        let count =
            diesel::delete(collection::table.filter(collection::id.eq_any(ids))).execute(conn)?;
        Ok(count)
    }
    /// 判断集合是否全部存在
    pub(in crate::application) fn exists_all(
        tag_ids: &HashSet<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        let database_tags: HashSet<i64> = collection::table
            .filter(collection::id.eq_any(tag_ids))
            .select(collection::id)
            .load::<i64>(conn)?
            .into_iter()
            .collect();
        for id in tag_ids {
            if !database_tags.contains(id) {
                return Err(crate::errors::missing(
                    crate::errors::ResourceKind::Collection,
                    *id,
                ));
            }
        }
        Ok(())
    }
    /// 更新
    pub(in crate::application) fn update(
        id: i64,
        name: &str,
        parent_id: Option<i64>,
        description: Option<&str>,
        path: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        let new_collection = diesel::update(collection::table.filter(collection::id.eq(id)))
            .set((
                collection::name.eq(name),
                collection::path.eq(path),
                collection::update_time.eq(OffsetDateTime::now_utc()),
                collection::parent_id.eq(parent_id),
                collection::description.eq(description),
            ))
            .get_result(conn)?;
        Ok(new_collection)
    }
}

/// path 相关
impl CollectionModel {
    /// 是否存在该路径
    pub(in crate::application) fn exists_by_path(
        path: &str,
        conn: &mut PgConnection,
    ) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::path.eq(path)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
}

/// parent_id 相关
impl CollectionModel {
    /// 获取父目录下的所有目录
    pub(in crate::application) fn get_list_by_parent(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        match parent_id {
            Some(parent_id) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(parent_id))
                    .load(conn)?;
                Ok(collections)
            }
            None => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .load(conn)?;
                Ok(collections)
            }
        }
    }
    /// 获取父目录下的所有目录数量
    pub(in crate::application) fn get_count(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<i64> {
        match parent_id {
            Some(id) => {
                let count = collection::table
                    .filter(collection::parent_id.eq(id))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            None => {
                let count = collection::table
                    .filter(collection::parent_id.is_null())
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
        }
    }
    /// 根据 offset limit 获取父目录下限定目录
    pub(in crate::application) fn list_by_parent_with_page(
        parent_id: Option<i64>,
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        match parent_id {
            Some(id) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(id))
                    .order(collection::id.asc())
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            None => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .order(collection::id.asc())
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
        }
    }
}

/// all
impl CollectionModel {
    /// 获取所有目录
    pub(in crate::application) fn get_list(conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let collections = collection::table.load(conn)?;
        Ok(collections)
    }
}

#[cfg(test)]
mod test {

    use crate::application::repository::schema::collection;
    use diesel::{debug_query, pg::Pg, prelude::*};

    #[test]
    fn test_sql() {
        let query = diesel::delete(collection::table.filter(collection::id.eq(2)));
        let sql = debug_query::<Pg, _>(&query).to_string();
        assert_eq!(
            sql,
            "DELETE FROM \"collection\" WHERE (\"collection\".\"id\" = $1) -- binds: [2]"
        )
    }
}
