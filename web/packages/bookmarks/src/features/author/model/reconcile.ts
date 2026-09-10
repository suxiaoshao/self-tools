import type { ApolloClient } from '@apollo/client';
import { ReadBookmarkAuthorStateDocument as ReadAuthorState } from '@bookmarks/gql/graphql';

export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadAuthorState, variables: { id }, fetchPolicy: 'network-only' });
  return !response.error && response.data?.getAuthor === null;
}
