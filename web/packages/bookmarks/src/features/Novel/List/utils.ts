/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-02 00:14:25
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-15 09:35:01
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/utils.ts
 */
import { GetNovelsQueryVariables } from '@bookmarks/graphql';
import { match, P } from 'ts-pattern';

export function convertFormToVariables({
  collectionMatch,
  novelStatus,
  tagMatch,
}: GetNovelsQueryVariables): GetNovelsQueryVariables {
  return {
    collectionMatch: match(collectionMatch)
      .with(
        {
          fullMatch: P.nonNullable,
          matchSet: P.nonNullable,
        },
        ({ fullMatch, matchSet }) => ({ fullMatch, matchSet }),
      )
      .otherwise(() => undefined),
    novelStatus,
    tagMatch: match(tagMatch)
      .with(
        {
          fullMatch: P.nonNullable,
          matchSet: P.nonNullable,
        },
        ({ fullMatch, matchSet }) => ({ fullMatch, matchSet }),
      )
      .otherwise(() => undefined),
  };
}
