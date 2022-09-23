pub(crate) trait ChapterFn: Sized {
    fn url(&self) -> String;
    fn title(&self) -> &str;
}

pub(crate) trait ChapterDetail: ChapterFn {
    fn content(&self) -> &str;
}
