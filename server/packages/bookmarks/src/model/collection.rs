use std::collections::{HashMap, HashSet};

use crate::errors::{GraphqlError, GraphqlResult};

use super::schema::collection::{self};
use diesel::prelude::*;
use time::OffsetDateTime;
use tracing::{event, Level};

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub(crate) struct CollectionModel {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) path: String,
    pub(crate) parent_id: Option<i64>,
    pub(crate) description: Option<String>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

#[derive(Insertable)]
#[diesel(table_name = collection)]
struct NewCollection<'a> {
    pub(crate) name: &'a str,
    pub(crate) path: &'a str,
    pub(crate) parent_id: Option<i64>,
    pub(crate) description: Option<String>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

/// path 相关
impl CollectionModel {
    /// 创建目录
    pub(crate) fn create(
        name: &str,
        path: &str,
        parent_id: Option<i64>,
        description: Option<String>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
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
    pub(crate) fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(
            collection::table.filter(collection::id.eq(id)),
        ))
        .get_result(conn)?;
        Ok(exists)
    }
    /// 查找目录
    pub(crate) fn find_one(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let collection = collection::table
            .filter(collection::id.eq(id))
            .first(conn)?;
        Ok(collection)
    }
    /// 根据列表删除目录
    pub(crate) fn delete_list(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<usize> {
        let count =
            diesel::delete(collection::table.filter(collection::id.eq_any(ids))).execute(conn)?;
        Ok(count)
    }
    /// 判断集合是否全部存在
    pub(crate) fn exists_all(tag_ids: &HashSet<i64>, conn: &mut PgConnection) -> GraphqlResult<()> {
        let database_tags = CollectionModel::get_list(conn)?;
        let database_tags: HashSet<i64> = database_tags.into_iter().map(|tag| tag.id).collect();
        for id in tag_ids {
            if !database_tags.contains(id) {
                event!(Level::ERROR, "集合不存在: {}", id);
                return Err(GraphqlError::NotFound("集合", *id));
            }
        }
        Ok(())
    }
}

/// path 相关
impl CollectionModel {
    /// 是否存在该路径
    pub(crate) fn exists_by_path(path: &str, conn: &mut PgConnection) -> GraphqlResult<bool> {
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
    pub(crate) fn get_list_by_parent(
        parent_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
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
}

/// all
impl CollectionModel {
    /// 获取所有目录
    pub(crate) fn get_list(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let collections = collection::table.load(conn)?;
        Ok(collections)
    }
    /// 获取所有目录映射
    pub(crate) fn get_map(conn: &mut PgConnection) -> GraphqlResult<HashMap<i64, Vec<i64>>> {
        let all_collections = collection::table
            .select((collection::id, collection::parent_id))
            .get_results::<(i64, Option<i64>)>(conn)?;
        // 构建一个 `id` 到其子节点列表的映射
        let mut lookup: HashMap<i64, Vec<i64>> = HashMap::new();
        for (id, parent_id) in all_collections {
            if let Some(parent_id) = parent_id {
                lookup.entry(parent_id).or_default().push(id);
            }
        }

        Ok(lookup)
    }
}

#[cfg(test)]
mod test {

    use crate::model::schema::collection;
    use diesel::{debug_query, pg::Pg, prelude::*};

    #[test]
    fn test_sql() {
        let query = diesel::delete(collection::table.filter(collection::id.eq(2)));
        let sql = debug_query::<Pg, _>(&query).to_string();
        assert_eq!(
            sql,
            "DELETE  FROM \"collection\" WHERE (\"collection\".\"id\" = $1) -- binds: [2]"
        )
    }
}
