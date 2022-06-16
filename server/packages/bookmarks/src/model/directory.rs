use crate::errors::GraphqlResult;

use super::schema::directory;
use super::CONNECTION;
use async_graphql::SimpleObject;
use chrono::NaiveDateTime;
use diesel::prelude::*;

#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct DirectoryModel {
    pub id: i64,
    pub path: String,
    pub father_directory: Option<i64>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

#[derive(SimpleObject)]
pub struct Directory {
    pub id: i64,
    pub path: String,
    pub father_directory: Option<i64>,
    pub create_time: i64,
    pub update_time: i64,
}

impl From<DirectoryModel> for Directory {
    fn from(model: DirectoryModel) -> Self {
        Self {
            id: model.id,
            path: model.path,
            father_directory: model.father_directory,
            create_time: model.create_time.timestamp_millis(),
            update_time: model.update_time.timestamp_millis(),
        }
    }
}

#[derive(Insertable)]
#[table_name = "directory"]
struct NewDirectory<'a> {
    pub path: &'a str,
    pub father_directory: Option<i64>,
    pub create_time: NaiveDateTime,
    pub update_time: NaiveDateTime,
}

impl DirectoryModel {
    pub fn create(path: &str, father_directory: Option<i64>) -> GraphqlResult<Self> {
        let now = chrono::Local::now().naive_local();
        let new_directory = NewDirectory {
            path,
            father_directory,
            create_time: now,
            update_time: now,
        };
        let conn = CONNECTION.get()?;

        let new_directory = diesel::insert_into(directory::table)
            .values(&new_directory)
            .get_result(&conn)?;
        Ok(new_directory)
    }
}

#[cfg(test)]
mod test {
    use diesel::prelude::*;
    use diesel::{Connection, PgConnection};

    use crate::model::directory::DirectoryModel;

    #[test]
    fn test_query() -> anyhow::Result<()> {
        use super::super::schema::directory::dsl::*;
        let database_url = dotenv::var("DATABASE_URL")?;
        let conn = &PgConnection::establish(&database_url)?;
        let data = directory.load::<DirectoryModel>(conn)?;
        println!("{:?}", data);
        Ok(())
    }
}
