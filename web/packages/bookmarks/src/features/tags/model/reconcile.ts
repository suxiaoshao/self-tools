import type { ApolloClient } from '@apollo/client';
import { graphql } from '@bookmarks/gql/index';
const ReadTagsState = graphql(`
  query ReadBookmarkTagsState {
    allTags {
      id
    }
  }
`);
export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadTagsState, fetchPolicy: 'network-only' });
  return !response.error && !!response.data?.allTags && !response.data.allTags.some((tag) => tag.id === id);
}
