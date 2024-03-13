use std::collections::HashSet;

use super::schema::{
    custom_type::{NovelSite, NovelStatus},
    novel,
};
use crate::{errors::GraphqlResult, graphql::input::TagMatch};
use diesel::prelude::*;
use time::OffsetDateTime;

#[derive(Queryable)]
pub struct NovelModel {
    pub id: i64,
    pub name: String,
    pub avatar: String,
    pub description: String,
    pub author_id: i64,
    pub novel_status: NovelStatus,
    pub site: NovelSite,
    pub site_id: String,
    pub tags: Vec<i64>,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}
#[derive(Insertable)]
#[diesel(table_name = novel)]
pub struct NewNovel<'a> {
    pub name: &'a str,
    pub avatar: &'a str,
    pub description: &'a str,
    pub author_id: i64,
    pub novel_status: NovelStatus,
    pub site: NovelSite,
    pub site_id: &'a str,
    pub tags: Vec<i64>,
    pub collection_id: Option<i64>,
    pub create_time: OffsetDateTime,
    pub update_time: OffsetDateTime,
}

impl NewNovel<'_> {
    pub fn create(&self) -> GraphqlResult<NovelModel> {
        let conn = &mut super::CONNECTION.get()?;
        let new_novel = diesel::insert_into(novel::table)
            .values(self)
            .get_result(conn)?;
        Ok(new_novel)
    }
}

/// id 相关
impl NovelModel {
    /// 删除小说
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        let conn = &mut super::CONNECTION.get()?;
        let novel = diesel::delete(novel::table.filter(novel::id.eq(id))).get_result(conn)?;
        Ok(novel)
    }
    /// 查找小说
    pub fn find_one(id: i64) -> GraphqlResult<Self> {
        let conn = &mut super::CONNECTION.get()?;
        let novel = novel::table.filter(novel::id.eq(id)).first::<Self>(conn)?;
        Ok(novel)
    }
    /// 判断是否存在
    pub fn exists(id: i64) -> GraphqlResult<bool> {
        let conn = &mut super::CONNECTION.get()?;
        let exists = diesel::select(diesel::dsl::exists(novel::table.filter(novel::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
}

/// collection_id 相关
impl NovelModel {
    /// 查询小说
    pub fn query(
        collection_id: Option<i64>,
        tag_match: Option<TagMatch>,
        novel_status: Option<NovelStatus>,
    ) -> GraphqlResult<Vec<Self>> {
        let conn = &mut super::CONNECTION.get()?;
        // 获取数据
        let data = match (collection_id, novel_status) {
            (Some(collection_id), Some(novel_status)) => novel::table
                .filter(novel::collection_id.eq(collection_id))
                .filter(novel::novel_status.eq(novel_status))
                .load::<Self>(conn)?,
            (Some(collection_id), None) => novel::table
                .filter(novel::collection_id.eq(collection_id))
                .load(conn)?,
            (None, Some(read_status)) => novel::table
                .filter(novel::novel_status.eq(read_status))
                .filter(novel::collection_id.is_null())
                .load::<Self>(conn)?,
            (None, None) => novel::table.load(conn)?,
        };
        // 若 tag_match 为 None 则直接返回
        let TagMatch {
            full_match,
            match_set,
        } = match tag_match {
            Some(value) => value,
            None => return Ok(data),
        };
        // match_set 为空则直接返回
        if match_set.is_empty() {
            return Ok(data);
        }
        let data = if full_match {
            data.into_iter()
                .filter(|NovelModel { tags, .. }| {
                    let tags = tags.iter().cloned().collect::<HashSet<_>>();
                    match_set.is_subset(&tags)
                })
                .collect()
        } else {
            data.into_iter()
                .filter(|NovelModel { tags, .. }| tags.iter().any(|x| match_set.contains(x)))
                .collect()
        };
        Ok(data)
    }
    /// 根据 collection_id 删除小说
    pub fn delete_by_collection_id(collection_id: i64) -> GraphqlResult<usize> {
        let conn = &mut super::CONNECTION.get()?;
        let deleted = diesel::delete(novel::table.filter(novel::collection_id.eq(collection_id)))
            .execute(conn)?;
        Ok(deleted)
    }
}

/// 作者相关
impl NovelModel {
    /// 查询小说
    pub fn query_by_author_id(author_id: i64) -> GraphqlResult<Vec<Self>> {
        let conn = &mut super::CONNECTION.get()?;
        let data = novel::table
            .filter(novel::author_id.eq(author_id))
            .load(conn)?;
        Ok(data)
    }
}

#[cfg(test)]
mod test {
    use diesel::{debug_query, pg::Pg};

    use crate::model::schema::novel;
    use diesel::prelude::*;

    #[test]
    fn test() {
        let query = diesel::delete(novel::table.find(2));
        let sql = debug_query::<Pg, _>(&query).to_string();
        assert_eq!(
            sql,
            "DELETE  FROM \"novel\" WHERE (\"novel\".\"id\" = $1) -- binds: [2]"
        );
    }
}
