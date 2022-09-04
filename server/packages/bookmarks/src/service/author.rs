use async_graphql::SimpleObject;

use crate::{
    errors::{GraphqlError, GraphqlResult},
    model::author::AuthorModel,
};

#[derive(SimpleObject)]
pub struct Author {
    pub id: i64,
    pub url: String,
    pub name: String,
    pub avatar: String,
    pub description: String,
    pub create_time: i64,
    pub update_time: i64,
}

impl From<AuthorModel> for Author {
    fn from(value: AuthorModel) -> Self {
        Self {
            id: value.id,
            url: value.url,
            name: value.name,
            avatar: value.avatar,
            description: value.description,
            create_time: value.create_time.timestamp_millis(),
            update_time: value.update_time.timestamp_millis(),
        }
    }
}

impl Author {
    /// 创建作者
    pub fn create(url: &str, name: &str, avatar: &str, description: &str) -> GraphqlResult<Self> {
        let new_author = AuthorModel::create(url, name, avatar, description)?;
        Ok(new_author.into())
    }
    /// 删除作者
    pub fn delete(id: i64) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(id)? {
            return Err(GraphqlError::NotFound("作者", id));
        }
        let deleted_author = AuthorModel::delete(id)?;
        Ok(deleted_author.into())
    }
    /// 获取作者列表
    pub fn query(search_name: Option<String>) -> GraphqlResult<Vec<Self>> {
        let authors = match search_name {
            Some(search_name) => AuthorModel::get_search_list(search_name)?,
            None => AuthorModel::get_list()?,
        };
        Ok(authors.into_iter().map(|x| x.into()).collect())
    }
    /// 获取作者
    pub fn get(id: i64) -> GraphqlResult<Self> {
        // 作者不存在
        if !AuthorModel::exists(id)? {
            return Err(GraphqlError::NotFound("作者", id));
        }
        let author = AuthorModel::get(id)?;
        Ok(author.into())
    }
}
