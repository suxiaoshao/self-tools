import type { CollectionAndItemsQuery } from '@collections/graphql';

export type CollectionAndItem = CollectionAndItemsQuery['collectionAndItem']['data'][0];
