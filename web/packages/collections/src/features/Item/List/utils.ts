import { match, P } from 'ts-pattern';
import type { PageState } from 'custom-table';
import type { GetItemsQueryVariables } from '@collections/gql/graphql';

export function convertFormToVariables(
  { collectionMatch }: Omit<GetItemsQueryVariables, 'pagination'>,
  pageState: PageState,
): GetItemsQueryVariables {
  return {
    collectionMatch: match(collectionMatch)
      .with(
        {
          fullMatch: P.nonNullable,
          matchSet: P.when((matchSet) => matchSet?.length > 0),
        },
        ({ fullMatch, matchSet }) => ({ fullMatch, matchSet }),
      )
      // eslint-disable-next-line no-useless-undefined
      .otherwise(() => undefined),
    pagination: {
      page: pageState.pageIndex,
      pageSize: pageState.pageSize,
    },
  };
}
