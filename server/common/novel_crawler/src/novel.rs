use crate::{chapter::ChapterFn, errors::NovelResult};
#[async_trait::async_trait]
pub(crate) trait NovelFn: Sized {
    type Chapter: ChapterFn;
    async fn get_novel_data(novel_id: &str) -> NovelResult<Self>;
    fn url(&self) -> &str;
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn image(&self) -> &str;
    async fn chapters(&self) -> &[Self::Chapter];
}
