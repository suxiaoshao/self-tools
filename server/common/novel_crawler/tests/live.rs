//! Explicit, read-only compatibility checks against public sites.
use novel_crawler::{AuthorFn, ChapterFn, JJAuthor, JJNovel, NovelFn, QDAuthor, QDNovel};

async fn check_author<T: AuthorFn>(id: &str) -> anyhow::Result<()> {
    let author = T::get_author_data(id).await?;
    assert_eq!(author.id(), id);
    assert!(!author.name().trim().is_empty());
    assert!(!author.image().is_empty());
    assert!(author.novel_ids().iter().all(|id| !id.is_empty()));
    Ok(())
}

async fn check_novel<T: NovelFn>(id: &str) -> anyhow::Result<()> {
    let novel = T::get_novel_data(id).await?;
    assert_eq!(novel.id(), id);
    assert!(!novel.name().trim().is_empty());
    assert!(!novel.author_id().is_empty());
    assert!(!novel.image().is_empty());
    assert!(!novel.chapters().is_empty());
    assert!(novel.chapters().iter().all(|chapter| {
        chapter.novel_id() == id && !chapter.chapter_id().is_empty() && !chapter.title().is_empty()
    }));
    Ok(())
}

#[tokio::test]
#[ignore = "requires public Qidian access; run the live target explicitly"]
async fn qidian_author() -> anyhow::Result<()> {
    check_author::<QDAuthor>("4362948").await
}

#[tokio::test]
#[ignore = "requires public Qidian access; run the live target explicitly"]
async fn qidian_novel() -> anyhow::Result<()> {
    check_novel::<QDNovel>("1040796068").await
}

#[tokio::test]
#[ignore = "requires public JJWXC access; run the live target explicitly"]
async fn jjwxc_author() -> anyhow::Result<()> {
    check_author::<JJAuthor>("1000001").await?;
    check_author::<JJAuthor>("809836").await
}

#[tokio::test]
#[ignore = "requires public JJWXC access; run the live target explicitly"]
async fn jjwxc_novel() -> anyhow::Result<()> {
    check_novel::<JJNovel>("6357210").await?;
    check_novel::<JJNovel>("4177492").await
}
