/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-02 18:09:16
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-02 18:12:04
 * @FilePath: /self-tools/web/packages/bookmarks/src/utils/image.ts
 */
const HOST = 'https://bookmarks.sushao.top';

export function getImageUrl(url: string) {
  const urlObj = new URL(HOST);
  const searchParams = new URLSearchParams();
  searchParams.set('url', url);
  urlObj.search = searchParams.toString();
  urlObj.pathname = '/fetch-content';
  return urlObj.toString();
}
