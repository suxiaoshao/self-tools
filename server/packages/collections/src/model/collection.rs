use super::schema::collection;
use crate::{
    errors::{GraphqlError, GraphqlResult},
    graphql::types::TimeRange,
    model::schema::collection_item,
};
use diesel::prelude::*;
use std::collections::{HashMap, HashSet};
use time::OffsetDateTime;
use tracing::{Level, event};

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub(crate) struct CollectionModel {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) path: String,
    pub(crate) description: Option<String>,
    pub(crate) parent_id: Option<i64>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = collection)]
struct NewCollection<'a> {
    pub(crate) name: &'a str,
    pub(crate) path: &'a str,
    pub(crate) description: Option<String>,
    pub(crate) parent_id: Option<i64>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

/// id 相关
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
    /// 判断目录是否存在
    pub(crate) fn exists_many(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<bool> {
        let agg_ids = collection::table
            .select(collection::id)
            .load::<i64>(conn)?
            .into_iter()
            .collect::<HashSet<i64>>();
        let ids = ids.iter().copied().collect::<HashSet<i64>>();
        Ok(agg_ids.is_superset(&ids))
    }
    /// 查找目录
    pub(crate) fn find_one(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let collection = collection::table
            .filter(collection::id.eq(id))
            .first(conn)?;
        Ok(collection)
    }
    /// 删除目录
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let collection =
            diesel::delete(collection::table.filter(collection::id.eq(id))).get_result(conn)?;
        Ok(collection)
    }
    /// 更新目录
    pub(crate) fn update(
        id: i64,
        name: &str,
        description: Option<&str>,
        path: &str,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let collection = diesel::update(collection::table.find(id))
            .set((
                collection::name.eq(name),
                collection::description.eq(description),
                collection::update_time.eq(now),
                collection::path.eq(path),
            ))
            .get_result(conn)?;
        Ok(collection)
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
    pub(crate) fn list_parent(
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
    /// 获取父目录下的目录
    pub(crate) fn list_parent_with_page(
        parent_id: Option<i64>,
        create_time: Option<TimeRange>,
        update_time: Option<TimeRange>,
        offset: i64,
        limit: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        match (parent_id, create_time, update_time) {
            (None, None, None) => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (None, None, Some(update_time)) => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (None, Some(create_time), None) => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (None, Some(create_time), Some(update_time)) => {
                let collections = collection::table
                    .filter(collection::parent_id.is_null())
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (Some(id), None, None) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(id))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (Some(id), None, Some(update_time)) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(id))
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (Some(id), Some(create_time), None) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(id))
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
            (Some(id), Some(create_time), Some(update_time)) => {
                let collections = collection::table
                    .filter(collection::parent_id.eq(id))
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .offset(offset)
                    .limit(limit)
                    .load(conn)?;
                Ok(collections)
            }
        }
    }
    /// 获取父目录下的目录数量
    pub(crate) fn get_count_by_parent(
        parent_id: Option<i64>,
        create_time: Option<TimeRange>,
        update_time: Option<TimeRange>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<i64> {
        match (parent_id, create_time, update_time) {
            (None, None, None) => {
                let count = collection::table
                    .filter(collection::parent_id.is_null())
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (None, None, Some(update_time)) => {
                let count = collection::table
                    .filter(collection::parent_id.is_null())
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (None, Some(create_time), None) => {
                let count = collection::table
                    .filter(collection::parent_id.is_null())
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (None, Some(create_time), Some(update_time)) => {
                let count = collection::table
                    .filter(collection::parent_id.is_null())
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (Some(id), None, None) => {
                let count = collection::table
                    .filter(collection::parent_id.eq(id))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (Some(id), None, Some(update_time)) => {
                let count = collection::table
                    .filter(collection::parent_id.eq(id))
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (Some(id), Some(create_time), None) => {
                let count = collection::table
                    .filter(collection::parent_id.eq(id))
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
            (Some(id), Some(create_time), Some(update_time)) => {
                let count = collection::table
                    .filter(collection::parent_id.eq(id))
                    .filter(collection::create_time.between(create_time.start, create_time.end))
                    .filter(collection::update_time.between(update_time.start, update_time.end))
                    .count()
                    .get_result(conn)?;
                Ok(count)
            }
        }
    }
}

/// item id 相关
impl CollectionModel {
    pub(crate) fn get_collections_by_item_id(
        item_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<CollectionModel>> {
        let collections = collection::table
            .inner_join(collection_item::table)
            .filter(collection_item::item_id.eq(item_id))
            .load::<(CollectionModel, (i64, i64))>(conn)?;
        Ok(collections.into_iter().map(|(model, _)| model).collect())
    }
}

/// alll
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
