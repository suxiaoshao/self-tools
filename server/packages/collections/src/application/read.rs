use super::{Application, Collection};
use crate::errors::AppResult;
use std::{collections::HashMap, sync::Arc};
#[derive(Clone)]
pub(crate) enum Ancestry {
    Found(Vec<Arc<Collection>>),
    Missing(i64),
    Cycle,
}
impl Application {
    pub(crate) async fn batch_item_collections(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Vec<Arc<Collection>>>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_item_collections", move |conn| {
                super::repository::read::item_collections(&ids, conn)
            })
            .await
    }
    pub(crate) async fn batch_ancestors(
        &self,
        mut ids: Vec<i64>,
    ) -> AppResult<HashMap<i64, Ancestry>> {
        ids.sort_unstable();
        ids.dedup();
        self.database
            .run("batch_ancestors", move |conn| {
                super::repository::read::ancestors(&ids, conn)
            })
            .await
    }
}
