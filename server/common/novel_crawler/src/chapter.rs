pub(crate) trait ChapterFn: Sized {
    fn url(&self) -> &str;
    fn title(&self) -> &str;
}
