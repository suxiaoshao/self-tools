import type { GetCollectionsQuery } from '@bookmarks/gql/graphql';

export type CollectionTableData = GetCollectionsQuery['getCollections']['data'][0];
