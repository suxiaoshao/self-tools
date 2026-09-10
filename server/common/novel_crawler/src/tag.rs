/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-05-29 03:26:39
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-29 04:08:56
 * @FilePath: /self-tools/server/common/novel_crawler/src/tag.rs
 */
pub trait TagFn {
    fn name(&self) -> &str;
    fn url(&self) -> String {
        Self::get_url_from_id(self.id())
    }
    fn id(&self) -> &str;
    fn get_url_from_id(id: &str) -> String;
}
