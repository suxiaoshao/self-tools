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
struct AuthorRow {
    #[diesel(sql_type = BigInt)]
    owner_id: i64,
    #[diesel(embed)]
    value: super::author::AuthorModel,
}
#[derive(QueryableByName)]
struct NovelRow {
    #[diesel(sql_type = BigInt)]
    owner_id: i64,
    #[diesel(embed)]
    value: super::novel::NovelModel,
}
#[derive(QueryableByName)]
struct TagRow {
    #[diesel(sql_type = BigInt)]
    owner_id: i64,
    #[diesel(embed)]
    value: super::tag::TagModel,
}
#[derive(QueryableByName)]
struct CollectionRow {
    #[diesel(sql_type = BigInt)]
    owner_id: i64,
    #[diesel(embed)]
    value: super::collection::CollectionModel,
}
#[derive(QueryableByName)]
struct NovelCommentRow {
    #[diesel(sql_type = BigInt)]
    owner_id: i64,
    #[diesel(embed)]
    value: super::novel_comment::NovelCommentModel,
}
pub(in crate::application) fn authors(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Arc<application::Author>>> {
    let mut result: HashMap<i64, Arc<application::Author>> = HashMap::new();
    for keys in ids.chunks(CHUNK) {
        for row in
            diesel::sql_query(r#"SELECT a.id AS owner_id, a.* FROM author a WHERE a.id = ANY($1)"#)
                .bind::<Array<BigInt>, _>(keys)
                .load::<AuthorRow>(conn)?
        {
            result.insert(row.owner_id, Arc::new(row.value.into()));
        }
    }
    Ok(result)
}
pub(in crate::application) fn novels(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Arc<application::Novel>>> {
    let mut result: HashMap<i64, Arc<application::Novel>> = HashMap::new();
    for keys in ids.chunks(CHUNK) {
        for row in
            diesel::sql_query(r#"SELECT n.id AS owner_id, n.* FROM novel n WHERE n.id = ANY($1)"#)
                .bind::<Array<BigInt>, _>(keys)
                .load::<NovelRow>(conn)?
        {
            result.insert(row.owner_id, Arc::new(row.value.into()));
        }
    }
    Ok(result)
}
pub(in crate::application) fn author_novels(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Vec<Arc<application::Novel>>>> {
    let mut result: HashMap<i64, Vec<Arc<application::Novel>>> = HashMap::new();
    for id in ids {
        result.insert(*id, Vec::new());
    }
    for keys in ids.chunks(CHUNK) {
        for row in diesel::sql_query(r#"SELECT n.author_id AS owner_id, n.* FROM novel n WHERE n.author_id = ANY($1) ORDER BY n.id"#).bind::<Array<BigInt>, _>(keys).load::<NovelRow>(conn)? {
result.entry(row.owner_id).or_default().push(Arc::new(row.value.into()));
}
    }
    Ok(result)
}
pub(in crate::application) fn novel_tags(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Vec<Arc<application::Tag>>>> {
    let mut result: HashMap<i64, Vec<Arc<application::Tag>>> = HashMap::new();
    for id in ids {
        result.insert(*id, Vec::new());
    }
    for keys in ids.chunks(CHUNK) {
        for row in diesel::sql_query(r#"SELECT n.id AS owner_id, t.* FROM novel n JOIN tag t ON t.id = ANY(n.tags) WHERE n.id = ANY($1) ORDER BY t.id"#).bind::<Array<BigInt>, _>(keys).load::<TagRow>(conn)? {
result.entry(row.owner_id).or_default().push(Arc::new(row.value.into()));
}
    }
    Ok(result)
}
pub(in crate::application) fn novel_collections(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Vec<Arc<application::Collection>>>> {
    let mut result: HashMap<i64, Vec<Arc<application::Collection>>> = HashMap::new();
    for id in ids {
        result.insert(*id, Vec::new());
    }
    for keys in ids.chunks(CHUNK) {
        for row in diesel::sql_query(r#"SELECT r.novel_id AS owner_id, c.* FROM collection_novel r JOIN collection c ON c.id = r.collection_id WHERE r.novel_id = ANY($1) ORDER BY c.id"#).bind::<Array<BigInt>, _>(keys).load::<CollectionRow>(conn)? {
result.entry(row.owner_id).or_default().push(Arc::new(row.value.into()));
}
    }
    Ok(result)
}
pub(in crate::application) fn novel_comments(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Arc<application::NovelComment>>> {
    let mut result: HashMap<i64, Arc<application::NovelComment>> = HashMap::new();
    for keys in ids.chunks(CHUNK) {
        for row in diesel::sql_query(
            r#"SELECT c.novel_id AS owner_id, c.* FROM novel_comment c WHERE c.novel_id = ANY($1)"#,
        )
        .bind::<Array<BigInt>, _>(keys)
        .load::<NovelCommentRow>(conn)?
        {
            result.insert(row.owner_id, Arc::new(row.value.into()));
        }
    }
    Ok(result)
}
pub(in crate::application) fn children(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Vec<Arc<application::Collection>>>> {
    let mut result: HashMap<i64, Vec<Arc<application::Collection>>> = HashMap::new();
    for id in ids {
        result.insert(*id, Vec::new());
    }
    for keys in ids.chunks(CHUNK) {
        for row in diesel::sql_query(r#"SELECT c.parent_id AS owner_id, c.* FROM collection c WHERE c.parent_id = ANY($1) ORDER BY c.id"#).bind::<Array<BigInt>, _>(keys).load::<CollectionRow>(conn)? {
result.entry(row.owner_id).or_default().push(Arc::new(row.value.into()));
}
    }
    Ok(result)
}
#[derive(QueryableByName)]
struct ChapterRow {
    #[diesel(sql_type = diesel::sql_types::Text)]
    site_novel_id: String,
    #[diesel(embed)]
    value: super::chapter::ChapterModel,
}
fn chapter(row: ChapterRow) -> Arc<application::Chapter> {
    Arc::new(application::Chapter::from(row.value, row.site_novel_id))
}
pub(in crate::application) fn chapters(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, Vec<Arc<application::Chapter>>>> {
    let mut result: HashMap<_, Vec<_>> = ids.iter().map(|id| (*id, Vec::new())).collect();
    for keys in ids.chunks(CHUNK) {
        let rows = diesel::sql_query("SELECT c.*, n.site_id AS site_novel_id, EXISTS(SELECT 1 FROM read_record r WHERE r.chapter_id = c.id) AS is_read FROM chapter c JOIN novel n ON n.id = c.novel_id WHERE c.novel_id = ANY($1) ORDER BY c.time, c.id")
   .bind::<Array<BigInt>, _>(keys).load::<ChapterRow>(conn)?;
        for row in rows {
            result
                .entry(row.value.novel_id)
                .or_default()
                .push(chapter(row));
        }
    }
    Ok(result)
}
pub(in crate::application) fn chapter_ends(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, application::read::ChapterEnds>> {
    let mut result: HashMap<_, application::read::ChapterEnds> =
        ids.iter().map(|id| (*id, Default::default())).collect();
    for keys in ids.chunks(CHUNK) {
        // Rank selected novels together; transfer only the two edges per novel.
        let rows = diesel::sql_query("WITH ranked AS (SELECT c.*, row_number() OVER (PARTITION BY novel_id ORDER BY time, id) AS first_rank, row_number() OVER (PARTITION BY novel_id ORDER BY time DESC, id DESC) AS last_rank FROM chapter c WHERE novel_id=ANY($1)) SELECT c.*, n.site_id AS site_novel_id, EXISTS(SELECT 1 FROM read_record r WHERE r.chapter_id=c.id) AS is_read FROM ranked c JOIN novel n ON n.id=c.novel_id WHERE c.first_rank=1 OR c.last_rank=1 ORDER BY c.time,c.id")
    .bind::<Array<BigInt>, _>(keys).load::<ChapterRow>(conn)?;
        for row in rows {
            let ends = result.entry(row.value.novel_id).or_default();
            let c = chapter(row);
            if ends.first.is_none() {
                ends.first = Some(c.clone());
            }
            ends.last = Some(c);
        }
    }
    Ok(result)
}
#[derive(QueryableByName)]
struct StatsRow {
    #[diesel(sql_type = BigInt)]
    id: i64,
    #[diesel(sql_type = diesel::sql_types::Numeric)]
    word_count: bigdecimal::BigDecimal,
    #[diesel(sql_type = diesel::sql_types::Double)]
    read_percentage: f64,
}
pub(in crate::application) fn stats(
    ids: &[i64],
    conn: &mut PgConnection,
) -> AppResult<HashMap<i64, application::read::NovelStats>> {
    let mut result = HashMap::new();
    for keys in ids.chunks(CHUNK) {
        let rows = diesel::sql_query("SELECT n.id, coalesce(sum(c.word_count),0)::numeric AS word_count, CASE WHEN count(c.id)=0 THEN 0::float8 ELSE 100.0 * count(c.id) FILTER (WHERE EXISTS(SELECT 1 FROM read_record r WHERE r.chapter_id=c.id AND r.novel_id=n.id))::float8/count(c.id) END AS read_percentage FROM novel n LEFT JOIN chapter c ON c.novel_id=n.id WHERE n.id=ANY($1) GROUP BY n.id")
  .bind::<Array<BigInt>, _>(keys).load::<StatsRow>(conn)?;
        for row in rows {
            result.insert(
                row.id,
                application::read::NovelStats {
                    word_count: row.word_count,
                    read_percentage: row.read_percentage,
                },
            );
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
