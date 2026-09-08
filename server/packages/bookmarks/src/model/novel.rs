use super::schema::{
    custom_type::{NovelSite, NovelStatus},
    novel,
};
use crate::errors::AppResult;
use diesel::prelude::*;
use novel_crawler::NovelFn;
use service_query::TagFilter;
use std::collections::HashSet;
use time::OffsetDateTime;

#[derive(Insertable)]
#[diesel(table_name = novel)]
pub(crate) struct NewNovel<'a> {
    pub(crate) name: &'a str,
    pub(crate) avatar: &'a str,
    pub(crate) description: &'a str,
    pub(crate) author_id: i64,
    pub(crate) novel_status: NovelStatus,
    pub(crate) site: NovelSite,
    pub(crate) site_id: &'a str,
    pub(crate) tags: Vec<i64>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

impl NewNovel<'_> {
    pub(crate) fn create(&self, conn: &mut PgConnection) -> AppResult<NovelModel> {
        let new_novel = diesel::insert_into(novel::table)
            .values(self)
            .get_result(conn)?;
        Ok(new_novel)
    }
}

#[derive(Queryable)]
pub(crate) struct NovelModel {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) avatar: String,
    pub(crate) description: String,
    pub(crate) author_id: i64,
    pub(crate) novel_status: NovelStatus,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) tags: Vec<i64>,
    pub(crate) create_time: OffsetDateTime,
    pub(crate) update_time: OffsetDateTime,
}

impl<T: NovelFn> PartialEq<T> for NovelModel {
    fn eq(&self, other: &T) -> bool {
        self.name == other.name()
            && self.avatar == other.image()
            && self.description == other.description()
            && self.novel_status == other.status()
    }
}

/// id 相关
impl NovelModel {
    /// 删除小说
    pub(crate) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let novel = diesel::delete(novel::table.filter(novel::id.eq(id))).get_result(conn)?;
        Ok(novel)
    }
    /// 查找小说
    pub(crate) fn find_one(id: i64, conn: &mut PgConnection) -> AppResult<Self> {
        let novel = novel::table.filter(novel::id.eq(id)).first::<Self>(conn)?;
        Ok(novel)
    }
    /// 判断是否存在
    pub(crate) fn exists(id: i64, conn: &mut PgConnection) -> AppResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(novel::table.filter(novel::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
}

/// collection_id 相关
impl NovelModel {
    /// 查询小说
    pub(crate) fn query(
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
    pub(crate) fn query_by_author_id(
        author_id: i64,
        conn: &mut PgConnection,
    ) -> AppResult<Vec<Self>> {
        let data = novel::table
            .filter(novel::author_id.eq(author_id))
            .load(conn)?;
        Ok(data)
    }
    pub(crate) fn ids_by_author_id(author_id: i64, conn: &mut PgConnection) -> AppResult<Vec<i64>> {
        let data = novel::table
            .filter(novel::author_id.eq(author_id))
            .select(novel::id)
            .load::<i64>(conn)?;
        Ok(data)
    }
}

/// site id

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
            "DELETE FROM \"novel\" WHERE (\"novel\".\"id\" = $1) -- binds: [2]"
        );
    }
}

#[derive(AsChangeset)]
#[diesel(table_name = novel)]
pub(crate) struct UpdateNovelModel<'a> {
    pub(crate) id: i64,
    pub(crate) name: Option<&'a str>,
    pub(crate) avatar: Option<&'a str>,
    pub(crate) description: Option<&'a str>,
    pub(crate) novel_status: Option<NovelStatus>,
    pub(crate) update_time: OffsetDateTime,
}

impl UpdateNovelModel<'_> {
    pub(crate) fn update(self, conn: &mut PgConnection) -> AppResult<NovelModel> {
        let novel = diesel::update(novel::table.filter(novel::id.eq(self.id)))
            .set(self)
            .get_result(conn)?;
        Ok(novel)
    }
}
