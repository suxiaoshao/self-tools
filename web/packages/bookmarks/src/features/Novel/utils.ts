/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 00:14:25
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-08 18:26:42
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/utils.ts
 */
import { GetNovelsQueryVariables } from '@bookmarks/graphql';

export function convertFormToVariables({
  collectionId,
  readStatus,
  tagMatch,
}: GetNovelsQueryVariables): GetNovelsQueryVariables {
  const { fullMatch, matchSet } = tagMatch ?? {};
  return {
    collectionId,
    readStatus,
    tagMatch: fullMatch !== undefined && matchSet !== undefined ? { fullMatch, matchSet } : undefined,
  };
}
