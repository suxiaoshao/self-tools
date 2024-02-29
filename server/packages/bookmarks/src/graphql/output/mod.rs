/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 20:43:34
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 07:35:44
 * @FilePath: /self-tools/server/packages/bookmarks/src/graphql/output/mod.rs
 */
use async_graphql::Union;
use novel_crawler::{AuthorFn, NovelFn};

use crate::{errors::GraphqlResult, model::schema::custom_type::NovelSite};

use self::author::{JjAuthor, QdAuthor};

mod author;
mod chapter;
mod novel;

#[derive(Union, Clone, Eq, PartialEq, Debug)]
pub enum DraftAuthorInfo {
    Qidian(QdAuthor),
    Jjwxc(JjAuthor),
}

impl DraftAuthorInfo {
    pub async fn new(id: String, novel_site: NovelSite) -> GraphqlResult<Self> {
        match novel_site {
            NovelSite::Qidian => Ok(DraftAuthorInfo::Qidian(QdAuthor::from(
                novel_crawler::QDAuthor::get_author_data(&id).await?,
            ))),
            NovelSite::Jjwxc => Ok(DraftAuthorInfo::Jjwxc(JjAuthor::from(
                novel_crawler::JJAuthor::get_author_data(&id).await?,
            ))),
        }
    }
}

#[derive(Union, Clone, Eq, PartialEq, Debug)]
pub enum DraftNovelInfo {
    Qidian(novel::QdNovel),
    Jjwxc(novel::JjNovel),
}

impl DraftNovelInfo {
    pub async fn new(id: String, novel_site: NovelSite) -> GraphqlResult<Self> {
        match novel_site {
            NovelSite::Qidian => Ok(DraftNovelInfo::Qidian(novel::QdNovel::from(
                novel_crawler::QDNovel::get_novel_data(&id).await?,
            ))),
            NovelSite::Jjwxc => Ok(DraftNovelInfo::Jjwxc(novel::JjNovel::from(
                novel_crawler::JJNovel::get_novel_data(&id).await?,
            ))),
        }
    }
}
