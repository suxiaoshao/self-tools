use std::collections::{HashMap, HashSet};

use super::schema::{
    custom_type::{NovelSite, NovelStatus},
    novel,
};
use crate::{errors::GraphqlResult, graphql::input::TagMatch, model::schema};
use diesel::{
    pg::Pg,
    prelude::*,
    query_builder::{QueryFragment, QueryId},
    sql_types::{BigInt, Nullable, Text, Timestamptz},
};
use novel_crawler::{AuthorFn, NovelFn};
use time::OffsetDateTime;

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
    pub fn create(&self, conn: &mut PgConnection) -> GraphqlResult<NovelModel> {
        let new_novel = diesel::insert_into(novel::table)
            .values(self)
            .get_result(conn)?;
        Ok(new_novel)
    }
    pub fn create_many(
        data: &[NewNovel],
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<NovelModel>> {
        let new_novels = diesel::insert_into(novel::table)
            .values(data)
            .get_results(conn)?;
        Ok(new_novels)
    }
}

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
    pub fn delete(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let novel = diesel::delete(novel::table.filter(novel::id.eq(id))).get_result(conn)?;
        Ok(novel)
    }
    /// 查找小说
    pub fn find_one(id: i64, conn: &mut PgConnection) -> GraphqlResult<Self> {
        let novel = novel::table.filter(novel::id.eq(id)).first::<Self>(conn)?;
        Ok(novel)
    }
    /// 判断是否存在
    pub fn exists(id: i64, conn: &mut PgConnection) -> GraphqlResult<bool> {
        let exists = diesel::select(diesel::dsl::exists(novel::table.filter(novel::id.eq(id))))
            .get_result(conn)?;
        Ok(exists)
    }
    /// 删除多个小说
    pub fn delete_many(ids: &[i64], conn: &mut PgConnection) -> GraphqlResult<usize> {
        let deleted = diesel::delete(novel::table.filter(novel::id.eq_any(ids))).execute(conn)?;
        Ok(deleted)
    }
}

/// collection_id 相关
impl NovelModel {
    /// 查询小说
    pub fn query(
        collection_id: Option<i64>,
        tag_match: Option<TagMatch>,
        novel_status: Option<NovelStatus>,
        conn: &mut PgConnection,
    ) -> GraphqlResult<Vec<Self>> {
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
    pub fn delete_by_collection_id(
        collection_id: i64,
        conn: &mut PgConnection,
    ) -> GraphqlResult<usize> {
        let deleted = diesel::delete(novel::table.filter(novel::collection_id.eq(collection_id)))
            .execute(conn)?;
        Ok(deleted)
    }
}

/// 作者相关
impl NovelModel {
    /// 查询小说
    pub fn query_by_author_id(author_id: i64, conn: &mut PgConnection) -> GraphqlResult<Vec<Self>> {
        let data = novel::table
            .filter(novel::author_id.eq(author_id))
            .load(conn)?;
        Ok(data)
    }
    /// 删除小说
    pub fn delete_by_author_id(author_id: i64, conn: &mut PgConnection) -> GraphqlResult<usize> {
        let deleted =
            diesel::delete(novel::table.filter(novel::author_id.eq(author_id))).execute(conn)?;
        Ok(deleted)
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

#[derive(AsChangeset)]
#[diesel(table_name = novel)]
pub struct UpdateNovelModel<'a> {
    pub id: i64,
    pub name: Option<&'a str>,
    pub avatar: Option<&'a str>,
    pub description: Option<&'a str>,
    pub novel_status: Option<NovelStatus>,
    pub update_time: OffsetDateTime,
}

impl UpdateNovelModel<'_> {
    pub fn update(self, conn: &mut PgConnection) -> GraphqlResult<NovelModel> {
        let novel = diesel::update(novel::table.filter(novel::id.eq(self.id)))
            .set(self)
            .get_result(conn)?;
        Ok(novel)
    }
    pub fn from_author<'a, T: NovelFn>(
        novels: &'a [NovelModel],
        fetch_novels: &'a [T],
        author_id: i64,
    ) -> (Vec<UpdateNovelModel<'a>>, Vec<NewNovel<'a>>, Vec<i64>) {
        let now = OffsetDateTime::now_utc();
        let mut update_novels = Vec::new();
        let mut new_novels = Vec::new();
        let mut novel_ids = Vec::new();

        // 更新小说 & 删除小说
        let fetch_novel_map = fetch_novels
            .iter()
            .map(|x| (x.id(), x))
            .collect::<HashMap<_, _>>();
        for novel in novels {
            let fetch_novel = fetch_novel_map.get(novel.site_id.as_str());
            match fetch_novel {
                Some(fetch_novel) if novel != *fetch_novel => {
                    let update_novel = UpdateNovelModel {
                        id: novel.id,
                        name: Some(fetch_novel.name()),
                        avatar: Some(fetch_novel.image()),
                        description: Some(fetch_novel.description()),
                        novel_status: Some(fetch_novel.status().into()),
                        update_time: now,
                    };
                    update_novels.push(update_novel);
                }
                None => {
                    novel_ids.push(novel.id);
                }
                _ => {}
            }
        }

        // 新增小说
        let novel_map = novels
            .iter()
            .map(|x| (x.site_id.as_str(), x))
            .collect::<HashMap<_, _>>();
        for fetch_novel in fetch_novels {
            if !novel_map.contains_key(fetch_novel.id()) {
                let new_novel = NewNovel {
                    name: fetch_novel.name(),
                    avatar: fetch_novel.image(),
                    description: fetch_novel.description(),
                    novel_status: fetch_novel.status().into(),
                    author_id,
                    site_id: fetch_novel.id(),
                    update_time: now,
                    site: T::Author::SITE.into(),
                    tags: vec![],
                    collection_id: None,
                    create_time: now,
                };
                new_novels.push(new_novel);
            }
        }
        (update_novels, new_novels, novel_ids)
    }

    pub fn update_many<'a>(
        data: &'a [UpdateNovelModel<'a>],
        conn: &mut PgConnection,
    ) -> GraphqlResult<()> {
        struct VecUpdateNovelModel<'a>(&'a [UpdateNovelModel<'a>]);

        impl VecUpdateNovelModel<'_> {
            fn new<'a>(data: &'a [UpdateNovelModel<'a>]) -> VecUpdateNovelModel<'a> {
                VecUpdateNovelModel(data)
            }
        }

        impl<'a> QueryId for VecUpdateNovelModel<'a> {
            type QueryId = ();
            const HAS_STATIC_QUERY_ID: bool = false;
        }
        impl<'a> QueryFragment<Pg> for VecUpdateNovelModel<'a> {
            fn walk_ast<'b>(
                &'b self,
                mut pass: diesel::query_builder::AstPass<'_, 'b, Pg>,
            ) -> QueryResult<()> {
                if self.0.is_empty() {
                    return Ok(());
                }
                pass.push_sql("UPDATE");
                novel::table.walk_ast(pass.reborrow())?;
                pass.push_sql(
                    r#"SET
                            name = COALESCE(data.name,name),
                            avatar = COALESCE(data.avatar,avatar),
                            description = COALESCE(data.description,description),
                            novel_status = COALESCE(data.novel_status,novel_status),
                            update_time = data.update_time
                        from (
                            values"#,
                );
                for (i, item) in self.0.iter().enumerate() {
                    if i > 0 {
                        pass.push_sql(",");
                    }
                    pass.push_sql("(");
                    pass.push_bind_param::<BigInt, _>(&item.id)?;
                    pass.push_sql(",");
                    pass.push_bind_param::<Nullable<Text>, _>(&item.name)?;
                    pass.push_sql(",");
                    pass.push_bind_param::<Nullable<Text>, _>(&item.avatar)?;
                    pass.push_sql(",");
                    pass.push_bind_param::<Nullable<Text>, _>(&item.description)?;
                    pass.push_sql(",");
                    pass.push_bind_param::<Nullable<schema::sql_types::NovelStatus>, _>(
                        &item.novel_status,
                    )?;
                    pass.push_sql(",");
                    pass.push_bind_param::<Timestamptz, _>(&item.update_time)?;
                    pass.push_sql(")");
                }
                pass.push_sql(
                    r#") as data(id, name, avatar, description, novel_status, update_time)
                        WHERE novel.id = data.id"#,
                );

                Ok(())
            }
        }
        impl<'a> RunQueryDsl<PgConnection> for VecUpdateNovelModel<'a> {}
        let data = VecUpdateNovelModel::new(data);
        data.execute(conn)?;
        Ok(())
    }
}
