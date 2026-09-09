use super::collection::CollectionModel;
use crate::errors::AppResult;
use diesel::{
    prelude::*,
    sql_types::{Array, BigInt, Bool, Nullable},
};
use service_query::{PageRange, Paginate, TagFilter};
#[derive(QueryableByName)]
struct Count {
    #[diesel(sql_type = BigInt)]
    total: i64,
}
const FILTER: &str = r#"WITH RECURSIVE descendants(root_id, collection_id) AS (
 SELECT id, id FROM collection WHERE id = ANY($1)
 UNION
 SELECT d.root_id, c.id FROM descendants d JOIN collection c ON c.parent_id = d.collection_id
), matching AS (
 SELECT n.* FROM novel n
 WHERE ($1::bigint[] IS NULL OR n.id IN (
   SELECT r.novel_id FROM descendants d JOIN collection_novel r ON r.collection_id = d.collection_id
   GROUP BY r.novel_id HAVING NOT $2 OR COUNT(DISTINCT d.root_id) = cardinality($1)
 ))
 AND ($3::bigint[] IS NULL OR CASE WHEN $4 THEN n.tags @> $3 ELSE n.tags && $3 END)
 AND ($5::novel_status IS NULL OR n.novel_status = $5)

)
"#;
pub(in crate::application) fn page(
    collections: Option<TagFilter>,
    tags: Option<TagFilter>,
    status: Option<crate::application::NovelStatus>,
    page: PageRange,
    conn: &mut PgConnection,
) -> AppResult<(Vec<crate::application::Novel>, i64)> {
    if let Some(v) = &collections {
        CollectionModel::exists_all(&v.match_set, conn)?;
    }
    if let Some(v) = &tags {
        super::tag::TagModel::exists_all(&v.match_set, conn)?;
    }
    let roots = collections
        .as_ref()
        .map(|v| v.match_set.iter().copied().collect::<Vec<_>>());
    let all = collections.as_ref().is_some_and(|v| v.full_match);
    let tag_ids = tags
        .as_ref()
        .map(|v| v.match_set.iter().copied().collect::<Vec<_>>());
    let tag_all = tags.as_ref().is_some_and(|v| v.full_match);
    let status: Option<super::schema::custom_type::NovelStatus> = status.map(Into::into);
    let total = diesel::sql_query(format!("{FILTER} SELECT count(*) AS total FROM matching"))
        .bind::<Nullable<Array<BigInt>>, _>(&roots)
        .bind::<Bool, _>(all)
        .bind::<Nullable<Array<BigInt>>, _>(&tag_ids)
        .bind::<Bool, _>(tag_all)
        .bind::<Nullable<super::schema::sql_types::NovelStatus>, _>(status)
        .get_result::<Count>(conn)?
        .total;
    let data = diesel::sql_query(format!(
        "{FILTER} SELECT * FROM matching ORDER BY id ASC OFFSET $6 LIMIT $7"
    ))
    .bind::<Nullable<Array<BigInt>>, _>(&roots)
    .bind::<Bool, _>(all)
    .bind::<Nullable<Array<BigInt>>, _>(&tag_ids)
    .bind::<Bool, _>(tag_all)
    .bind::<Nullable<super::schema::sql_types::NovelStatus>, _>(status)
    .bind::<BigInt, _>(page.offset())
    .bind::<BigInt, _>(page.limit())
    .load::<super::novel::NovelModel>(conn)?;
    Ok((data.into_iter().map(Into::into).collect(), total))
}
