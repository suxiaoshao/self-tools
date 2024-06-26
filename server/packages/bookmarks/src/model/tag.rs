use std::collections::{HashMap, HashSet};

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::collection::CollectionModel,
};

use super::schema::tag;
use diesel::prelude::*;
use time::OffsetDateTime;
use tracing::{event, Level};

#[derive(Queryable)]
pub struct TagModel {
    pub id: i64,
    pub name: String,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = tag)]
pub struct NewTag {
    pub name: String,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

/// id 相关
impl TagModel {
    /// 创建标签
    pub fn create(
        name: &str,
        collection_id: Option<i64>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Self> {
        let now = time::OffsetDateTime::now_utc();
        let new_tag = NewTag {
            name: name.to_string(),
            collection_id,
            create_time: now,
            update_time: now,
        };

        let new_tag = diesel::insert_into(tag::table)
            .values(&new_tag)
            .get_result(conn)?;
        Ok(new_tag)
    }
    /// 是否存在
    pub fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(tag::table.filter(tag::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除标签
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let deleted = diesel::delete(tag::table.filter(tag::id.eq(id))).get_result(conn)?;
        Ok(deleted)
    }
    /// 获取标签列表
    pub fn get_by_ids(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.filter(tag::id.eq_any(ids)).load::<Self>(conn)?;
        Ok(tags)
    }
    /// 判断标签是否全部存在
    pub fn exists_all<'a, T: Iterator<Item = &'a i64>>(
        tags: T,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        let tag_ids: HashSet<i64> = tags.cloned().collect();
        let database_tags = TagModel::get_list(conn)?;
        let database_tags: HashSet<i64> = database_tags.into_iter().map(|tag| tag.id).collect();
        for id in tag_ids {
            if !database_tags.contains(&id) {
                event!(Level::ERROR, "标签不存在: {}", id);
                return Err(GraphqlError::NotFound("标签", id));
            }
        }
        Ok(())
    }
}

/// by collection id
impl TagModel {
    /// 根据 collectionId 删除
    pub fn delete_by_collection(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let deleted = diesel::delete(tag::table.filter(tag::collection_id.eq(collection_id)))
            .execute(conn)?;
        Ok(deleted)
    }
    /// 根据 collectionId 查询
    pub fn query_by_collection(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table
            .filter(tag::collection_id.eq(collection_id))
            .load(conn)?;
        Ok(tags)
    }
    /// 递归获取可访问标签
    pub fn allow_tags(collection_id: i64, conn: &mut PgConnection) -> GraphqlResult<Vec<TagModel>> {
        let mut id = collection_id;

        // 获取全部标签id
        let tags = TagModel::get_list(conn)?;
        struct Collection {
            parent_id: Option<i64>,
            tags: Vec<TagModel>,
        }
        impl Collection {
            fn new(parent_id: Option<i64>) -> Self {
                Self {
                    parent_id,
                    tags: Vec::new(),
                }
            }
            fn push(&mut self, tag: TagModel) {
                self.tags.push(tag);
            }
        }
        // 初始化集合
        let mut collection_map = CollectionModel::get_list(conn)?
            .into_iter()
            .map(|CollectionModel { id, parent_id, .. }| (id, Collection::new(parent_id)))
            .collect::<HashMap<_, _>>();
        // 结果
        let mut result = Vec::new();
        // 遍历所有 tag, 将其加入到对应的 collection 中
        for tag in tags {
            match tag.collection_id {
                None => {
                    result.push(tag);
                }
                Some(tags_collection_id) => {
                    if let Some(collection) = collection_map.get_mut(&tags_collection_id) {
                        collection.push(tag);
                    }
                }
            }
        }
        while let Some(Collection { parent_id, tags }) = collection_map.remove(&id) {
            match parent_id {
                None => {
                    for tag in tags {
                        result.push(tag);
                    }
                    return Ok(result);
                }
                Some(parent_id) => {
                    for tag in tags {
                        result.push(tag);
                    }
                    id = parent_id;
                }
            }
        }
        Ok(result)
    }
    /// 验证 tags 属于 collection_id
    pub fn belong_to_collection<'a, T: Iterator<Item = &'a i64>>(
        collection_id: Option<i64>,
        tags: T,
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        let allow_tags = match collection_id {
            Some(id) => TagModel::allow_tags(id, conn)?,
            None => TagModel::query_root(conn)?,
        };
        let allow_tags: HashSet<_> = allow_tags.into_iter().map(|tag| tag.id).collect();
        // 存在不符合的 tags
        for tag in tags {
            if !allow_tags.contains(tag) {
                event!(
                    Level::ERROR,
                    "标签: {} 不属于集合: {:?}",
                    tag,
                    collection_id
                );
                return Err(GraphqlError::Scope {
                    sub_tag: "标签",
                    sub_value: *tag,
                    super_tag: "集合",
                    super_value: collection_id,
                });
            }
        }
        Ok(())
    }
}

/// all
impl TagModel {
    /// 获取所有标签
    pub fn get_list(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table.load(conn)?;

        Ok(tags)
    }

    /// 获取根目录标签
    pub fn query_root(conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let tags = tag::table
            .filter(tag::collection_id.is_null())
            .load::<Self>(conn)?;
        Ok(tags)
    }
}
