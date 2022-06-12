#[derive(Queryable)]
#[cfg_attr(test, derive(Debug))]
pub struct DirectoryModel {
    pub id: i64,
    pub path: String,
    pub father_directory: Option<i64>,
}

#[cfg(test)]
mod test {
    use diesel::prelude::*;
    use diesel::{Connection, PgConnection};

    use crate::model::directory::DirectoryModel;

    #[test]
    fn test_query() -> anyhow::Result<()> {
        use crate::schema::directory::dsl::*;
        let database_url = dotenv::var("DATABASE_URL")?;
        let conn = &PgConnection::establish(&database_url)?;
        let data = directory.load::<DirectoryModel>(conn)?;
        println!("{:?}", data);
        Ok(())
    }
}
