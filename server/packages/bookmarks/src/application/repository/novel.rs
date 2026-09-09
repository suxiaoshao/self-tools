use super::schema::{
    custom_type::{NovelSite, NovelStatus},
    novel,
};
use crate::errors::AppResult;
use diesel::prelude::*;

use service_query::TagFilter;
use std::collections::HashSet;
use time::OffsetDateTime;

#[derive(Insertable)]
#[diesel(table_name = novel)]
pub(in crate::application) struct NewNovel<'a> {
    pub(in crate::application) name: &'a str,
    pub(in crate::application) avatar: &'a str,
    pub(in crate::application) description: &'a str,
    pub(in crate::application) author_id: i64,
    pub(in crate::application) novel_status: NovelStatus,
    pub(in crate::application) site: NovelSite,
    pub(in crate::application) site_id: &'a str,
    pub(in crate::application) tags: Vec<i64>,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

impl NewNovel<'_> {
    pub(in crate::application) fn create(&self, conn: &mut PgConnection) -> AppResult<NovelModel> {
        let new_novel = diesel::insert_into(novel::table)
            .values(self)
            .get_result(conn)?;
        Ok(new_novel)
    }
}

#[derive(Queryable)]
pub(in crate::application) struct NovelModel {
    pub(in crate::application) id: i64,
    pub(in crate::application) name: String,
    pub(in crate::application) avatar: String,
    pub(in crate::application) description: String,
    pub(in crate::application) author_id: i64,
    pub(in crate::application) novel_status: NovelStatus,
    pub(in crate::application) site: NovelSite,
    pub(in crate::application) site_id: String,
    pub(in crate::application) tags: Vec<i64>,
    pub(in crate::application) create_time: OffsetDateTime,
    pub(in crate::application) update_time: OffsetDateTime,
}

/// id 相关
impl NovelModel {
    /// 删除小说
    pub(in crate::application) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let novel = diesel::delete(novel::table.filter(novel::id.eq(id))).get_result(conn)?;
        Ok(novel)
    }
    /// 查找小说
    pub(in crate::application) fn find_one(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let novel = novel::table.filter(novel::id.eq(id)).first::<Self>(conn)?;
        Ok(novel)
    }
    /// 判断是否存在
    pub(in crate::application) fn exists(id: i64, conn: &mut PgConnection) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(novel::table.filter(novel::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
}

/// collection_id 相关
impl NovelModel {
    /// 查询小说
    pub(in crate::application) fn query(
        tag_match: Option<TagFilter>,
        novel_status: Option<NovelStatus>,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        // 获取数据
        let data = match novel_status {
            Some(novel_status) => novel::table
                .filter(novel::novel_status.eq(novel_status))
                .load::<Self>(conn)?,
            None => novel::table.load(conn)?,
        };
        // 若 tag_match 为 None 则直接返回
        let TagFilter {
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
}

/// 作者相关
impl NovelModel {
    /// 查询小说
    pub(in crate::application) fn query_by_author_id(
        author_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let data = novel::table
            .filter(novel::author_id.eq(author_id))
            .load(conn)?;
        Ok(data)
    }
    pub(in crate::application) fn ids_by_author_id(
        author_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<i64>> {
        let data = novel::table
            .filter(novel::author_id.eq(author_id))
            .select(novel::id)
            .load::<i64>(conn)?;
        Ok(data)
    }
}

#[cfg(test)]
mod test {
    use diesel::{debug_query, pg::Pg};

    use crate::application::repository::schema::novel;
    use diesel::prelude::*;

    #[test]
    fn test() {
        let query = diesel::delete(novel::table.find(2));
        let sql = debug_query::<Pg, _>(&query).to_string();
        assert_eq!(
            sql,
            "DELETE FROM \"novel\" WHERE (\"novel\".\"id\" = $1) -- binds: [2]"
        );
    }
}

#[derive(AsChangeset)]
#[diesel(table_name = novel)]
pub(in crate::application) struct UpdateNovelModel<'a> {
    pub(in crate::application) id: i64,
    pub(in crate::application) name: Option<&'a str>,
    pub(in crate::application) avatar: Option<&'a str>,
    pub(in crate::application) description: Option<&'a str>,
    pub(in crate::application) novel_status: Option<NovelStatus>,
    pub(in crate::application) update_time: OffsetDateTime,
}

impl UpdateNovelModel<'_> {
    pub(in crate::application) fn update(self, conn: &mut PgConnection) -> AppResult<NovelModel> {
        let novel = diesel::update(novel::table.filter(novel::id.eq(self.id)))
            .set(self)
            .get_result(conn)?;
        Ok(novel)
    }
}
