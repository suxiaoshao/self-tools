/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-05-29 03:26:39
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-29 04:08:56
 * @FilePath: /self-tools/server/common/novel_crawler/src/tag.rs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
use crate::{AuthorFn, ChapterFn, NovelFn};

pub trait TagFn {
    type Author: AuthorFn;
    type Novel: NovelFn;
    type Chapter: ChapterFn;
    type Id: serde::Serialize + for<'de> serde::Deserialize<'de>;
    fn name(&self) -> &str;
    fn url(&self) -> String;
    fn id(&self) -> &Self::Id;
}
