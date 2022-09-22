use crate::{errors::NovelResult, novel::NovelFn};

#[async_trait::async_trait]
pub(crate) trait AuthorFn: Sized {
    type Novel: NovelFn;
    async fn get_author_data(author_id: &str) -> NovelResult<Self>;
    fn url(&self) -> &str;
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn image(&self) -> &str;
    async fn novels(&self) -> NovelResult<Vec<Self::Novel>>;
}
