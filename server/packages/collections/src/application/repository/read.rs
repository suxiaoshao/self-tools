use crate::{
    application::{self, read::Ancestry},
    errors::AppResult,
};
use diesel::{
    prelude::*,
    sql_types::{Array, BigInt, Bool},
};
use std::{collections::HashMap, sync::Arc};
const CHUNK: usize = 500;
#[derive(QueryableByName)]
struct CollectionRow {
    #[diesel(sql_type = BigInt)]
    owner_id: i64,
    #[diesel(embed)]
    value: super::collection::CollectionModel,
}
pub(in crate::application) fn item_collections(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Vec<Arc<application::Collection>>>> {
    let mut result: HashMap<i64, Vec<Arc<application::Collection>>> = HashMap::new();
    for id in ids {
        result.insert(*id, Vec::new());
    }
    for keys in ids.chunks(CHUNK) {
        for row in diesel::sql_query(r#"SELECT r.item_id AS owner_id, c.* FROM collection_item r JOIN collection c ON c.id=r.collection_id WHERE r.item_id=ANY($1) ORDER BY c.id"#).bind::<Array<BigInt>, _>(keys).load::<CollectionRow>(conn)? {
result.entry(row.owner_id).or_default().push(Arc::new(row.value.into()));
}
    }
    Ok(result)
}
#[derive(QueryableByName)]
struct AncestorRow {
    #[diesel(sql_type = BigInt)]
    root_id: i64,
    #[diesel(sql_type = BigInt)]
    depth: i64,
    #[diesel(sql_type = Bool)]
    cycle: bool,
    #[diesel(embed)]
    value: super::collection::CollectionModel,
}
pub(in crate::application) fn ancestors(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Ancestry>> {
    let mut result: HashMap<_, _> = ids.iter().map(|id| (*id, Ancestry::Missing(*id))).collect();
    for keys in ids.chunks(CHUNK) {
        let rows = diesel::sql_query("WITH RECURSIVE ancestors(root_id, id, parent_id, depth, visited, cycle) AS (SELECT id,id,parent_id,0::bigint,ARRAY[id],false FROM collection WHERE id=ANY($1) UNION ALL SELECT a.root_id,c.id,c.parent_id,a.depth+1,a.visited||c.id,c.id=ANY(a.visited) FROM ancestors a JOIN collection c ON c.id=a.parent_id WHERE NOT a.cycle) SELECT a.root_id,a.depth,a.cycle,c.* FROM ancestors a JOIN collection c ON c.id=a.id ORDER BY a.root_id,a.depth")
   .bind::<Array<BigInt>, _>(keys).load::<AncestorRow>(conn)?;
        let mut grouped: HashMap<i64, Vec<AncestorRow>> = HashMap::new();
        for row in rows {
            grouped.entry(row.root_id).or_default().push(row);
        }
        for (id, rows) in grouped {
            let value = if rows.iter().any(|r| r.cycle) {
                Ancestry::Cycle
            } else if let Some(parent) = rows.last().and_then(|r| r.value.parent_id) {
                Ancestry::Missing(parent)
            } else {
                Ancestry::Found(
                    rows.into_iter()
                        .rev()
                        .filter(|r| r.depth > 0)
                        .map(|r| Arc::new(r.value.into()))
                        .collect(),
                )
            };
            result.insert(id, value);
        }
    }
    Ok(result)
}
