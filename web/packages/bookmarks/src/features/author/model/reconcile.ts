import type { ApolloClient } from '@apollo/client';
import { graphql } from '@bookmarks/gql/index';
const ReadAuthorState = graphql(`
  query ReadBookmarkAuthorState($id: Int!) {
    getAuthor(id: $id) {
      id
    }
  }
`);
export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadAuthorState, variables: { id }, fetchPolicy: 'network-only' });
  return !response.error && response.data?.getAuthor === null;
}
