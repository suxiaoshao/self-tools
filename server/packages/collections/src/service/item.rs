use crate::{
    errors::*,
    model::{
        PgPool, collection::CollectionModel, collection_item::CollectionItemModel, item::ItemModel,
    },
    service::{
        input::{CollectionItemQuery, ItemAndCollection},
        utils::{find_all_children, find_all_item_by_collection},
    },
};
use diesel::{Connection, PgConnection, RunQueryDsl};
use service_query::{Paginate, Queryable, TagFilter};
use std::collections::HashSet;
use time::OffsetDateTime;
#[derive(Clone)]
pub(crate) struct Item {
    pub id: i64,
    pub name: String,
    pub content: String,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
impl From<ItemModel> for Item {
    fn from(v: ItemModel) -> Self {
        Self {
            id: v.id,
            name: v.name,
            content: v.content,
            create_time: v.create_time,
            update_time: v.update_time,
        }
    }
}
fn lock_relations(conn: &mut PgConnection) -> AppResult<()> {
    diesel::sql_query("LOCK TABLE collection, item, collection_item IN SHARE ROW EXCLUSIVE MODE")
        .execute(conn)?;
    Ok(())
}
impl Item {
    pub fn create(
        name: String,
        content: String,
        mut collection_ids: Vec<i64>,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        for (index, id) in collection_ids.iter().enumerate() {
            validate_id(*id, &format!("collectionIds.{index}"))?;
        }
        collection_ids.sort_unstable();
        collection_ids.dedup();
        conn.transaction(|conn| {
            lock_relations(conn)?;
            let mut resources = vec![];
            for id in &collection_ids {
                if !CollectionModel::exists(*id, conn)? {
                    resources.push(ResourceRef {
                        kind: ResourceKind::Collection,
                        id: *id,
                    });
                }
            }
            if !resources.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    resources,
                )));
            }
            let item = ItemModel::create(&name, &content, conn)?;
            if !collection_ids.is_empty() {
                item.add_collections(&collection_ids, conn)?;
            }
            Ok(item.into())
        })
    }
    pub fn get(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        validate_id(id, "id")?;
        if !ItemModel::exists(id, conn)? {
            return Err(missing(ResourceKind::Item, id));
        }
        Ok(ItemModel::find_one(id, conn)?.into())
    }
    pub fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        validate_id(id, "id")?;
        conn.transaction(|conn| {
            lock_relations(conn)?;
            if ItemModel::exists(id, conn)? {
                CollectionItemModel::delete_by_item_id(id, conn)?;
                ItemModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
    pub fn update(id: i64, name: &str, content: &str, conn: &mut PgConnection) -> AppResult<Self> {
        validate_id(id, "id")?;
        conn.transaction(|conn| {
            lock_relations(conn)?;
            Self::get(id, conn)?;
            Ok(ItemModel::update(id, name, content, conn)?.into())
        })
    }
    pub fn collections(
        id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<super::collection::Collection>> {
        Ok(CollectionModel::get_collections_by_item_id(id, conn)?
            .into_iter()
            .map(Into::into)
            .collect())
    }
    pub fn add_collection(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        validate_id(collection_id, "collectionId")?;
        validate_id(item_id, "itemId")?;
        conn.transaction(|conn| {
            lock_relations(conn)?;
            let mut resources = vec![];
            if !CollectionModel::exists(collection_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Collection,
                    id: collection_id,
                });
            }
            if !ItemModel::exists(item_id, conn)? {
                resources.push(ResourceRef {
                    kind: ResourceKind::Item,
                    id: item_id,
                });
            }
            if !resources.is_empty() {
                return Err(service_errors::UseCaseError::Rejected(Rejection::Missing(
                    resources,
                )));
            }
            if CollectionItemModel::exists(collection_id, item_id, conn)? {
                return Err(conflict(
                    ConflictReason::MembershipExists,
                    vec![
                        ResourceRef {
                            kind: ResourceKind::Collection,
                            id: collection_id,
                        },
                        ResourceRef {
                            kind: ResourceKind::Item,
                            id: item_id,
                        },
                    ],
                ));
            }
            CollectionItemModel::save(collection_id, item_id, conn)
        })
    }
    pub fn delete_collection(
        collection_id: i64,
        item_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<()> {
        validate_id(collection_id, "collectionId")?;
        validate_id(item_id, "itemId")?;
        CollectionItemModel::delete(collection_id, item_id, conn)
    }
    /// 查询
    pub(crate) fn query(
        collection_match: Option<TagFilter>,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        if let Some(TagFilter { match_set, .. }) = &collection_match {
            // collection 不存在
            CollectionModel::exists_all(match_set, conn)?;
        }
        let mut data = ItemModel::all(conn)?
            .into_iter()
            .map(Into::into)
            .collect::<Vec<Self>>();
        if let Some(TagFilter {
            match_set,
            full_match,
        }) = collection_match
        {
            // 构建一个 `id` 到其子节点列表的映射
            let collection_collection_map = CollectionModel::get_map(conn)?;

            if full_match {
                let collection_item_map = CollectionItemModel::map_collection_item(conn)?;
                // 找到所有集合对应的条目，然后取他们的交集
                let item_ids = match match_set.into_iter().try_fold(
                    HashSet::new(),
                    |mut acc, collection_id| -> Option<HashSet<i64>> {
                        let mut item_ids = HashSet::new();
                        find_all_item_by_collection(
                            &mut item_ids,
                            collection_id,
                            &collection_collection_map,
                            &collection_item_map,
                        );
                        match (acc.is_empty(), item_ids.is_empty()) {
                            (_, true) => None,
                            (true, false) => Some(item_ids),
                            (false, false) => {
                                acc.retain(|e| item_ids.contains(e));
                                Some(acc)
                            }
                        }
                    },
                ) {
                    Some(id) => id,
                    None => return Ok(vec![]),
                };

                data.retain(|Item { id, .. }| item_ids.contains(id));
            } else {
                // 初始化结果列表，并调用递归函数
                let mut all_set = HashSet::new();
                for id in &match_set {
                    all_set.insert(*id);
                    find_all_children(&mut all_set, *id, &collection_collection_map);
                }
                let item_collection_map = CollectionItemModel::map_item_collection(conn)?;
                data.retain(|Item { id, .. }| {
                    let item_collection = match item_collection_map.get(id) {
                        Some(item_collection) => item_collection,
                        None => return false,
                    };
                    !all_set.is_disjoint(item_collection)
                });
            }
        }
        Ok(data)
    }
}
pub(crate) struct ItemQueryRunner {
    query: CollectionItemQuery,
    count: i64,
    conn: PgPool,
}

impl ItemQueryRunner {
    pub(crate) async fn new(query: CollectionItemQuery, conn: PgPool) -> AppResult<Self> {
        let conn_temp = &mut conn.get()?;
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            ..
        } = query;
        let collection_id = match id {
            Some(id) => id,
            None => {
                return Ok(Self {
                    query,
                    count: 0,
                    conn,
                });
            }
        };
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn_temp)? {
            return Err(missing(ResourceKind::Collection, collection_id));
        }
        let count = ItemModel::count(collection_id, create_time, update_time, conn_temp)?;
        Ok(Self { query, count, conn })
    }
}

/// collection_id 相关
impl Queryable for ItemQueryRunner {
    type Item = ItemAndCollection;

    type Error = AppError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.count)
    }

    async fn query<P: Paginate>(&self, pagination: P) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();
        let CollectionItemQuery {
            id,
            create_time,
            update_time,
            ..
        } = self.query;

        let limit = pagination.limit();
        let conn = &mut self.conn.get()?;
        let collection_id = match id {
            Some(id) => id,
            None => {
                return Ok(vec![]);
            }
        };
        //  判断父目录是否存在
        if !CollectionModel::exists(collection_id, conn)? {
            return Err(missing(ResourceKind::Collection, collection_id));
        }
        let data = ItemModel::query(collection_id, create_time, update_time, offset, limit, conn)?
            .into_iter()
            .map(|d| ItemAndCollection::Item(Item::from(d)))
            .collect();
        Ok(data)
    }
}

pub(crate) struct ItemRunner {
    data: Vec<Item>,
}

impl ItemRunner {
    pub(crate) fn new(collection_match: Option<TagFilter>, conn: PgPool) -> AppResult<Self> {
        let conn = &mut conn.get()?;
        let data = Item::query(collection_match, conn)?;
        Ok(Self { data })
    }
}

impl Queryable for ItemRunner {
    type Item = Item;

    type Error = AppError;

    async fn len(&self) -> Result<i64, Self::Error> {
        Ok(self.data.len() as i64)
    }

    async fn query<P: Paginate>(&self, pagination: P) -> Result<Vec<Self::Item>, Self::Error> {
        let offset = pagination.offset();

        let limit = pagination.limit();
        Ok(self
            .data
            .iter()
            .skip(offset as usize)
            .take(limit as usize)
            .cloned()
            .collect())
    }
}
