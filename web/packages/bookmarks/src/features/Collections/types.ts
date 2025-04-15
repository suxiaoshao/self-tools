import type { GetCollectionsQuery } from '@bookmarks/graphql';

export type CollectionTableData = GetCollectionsQuery['getCollections'][0];
