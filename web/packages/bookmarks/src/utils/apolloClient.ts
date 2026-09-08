import { getClient } from 'custom-graphql';

export const apolloClient = getClient('/api/bookmarks/graphql');
