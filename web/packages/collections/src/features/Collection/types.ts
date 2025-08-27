import type { CollectionAndItemsQuery } from '@collections/gql/graphql';

export type CollectionAndItem = CollectionAndItemsQuery['collectionAndItem']['data'][0];
