/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 00:14:25
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-02 00:22:25
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/utils.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { GetNovelsQueryVariables } from '@bookmarks/graphql';
import { UseFormWatch, WatchedForm } from 'react-hook-form';

export function convertFormToVariables({
  collectionId,
  readStatus,
  tagMatch,
}: WatchedForm<GetNovelsQueryVariables>): GetNovelsQueryVariables {
  const { fullMatch, matchSet } = tagMatch ?? {};
  return {
    collectionId,
    readStatus,
    tagMatch: fullMatch !== undefined && matchSet !== undefined ? { fullMatch, matchSet } : undefined,
  };
}
