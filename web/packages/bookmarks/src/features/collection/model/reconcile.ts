import type { ApolloClient } from '@apollo/client';
import { graphql } from '@bookmarks/gql/index';
const ReadCollectionState = graphql(`
  query ReadBookmarkCollectionState($id: Int!) {
    getCollection(id: $id) {
      id
      name
      description
      parentId
    }
  }
`);
export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadCollectionState, variables: { id }, fetchPolicy: 'network-only' });
  return !response.error && response.data?.getCollection === null;
}
export async function checkCollection(
  client: ApolloClient,
  id: number,
  expected: { name: string; description?: string | null; parentId?: number | null },
) {
  const r = await client.query({ query: ReadCollectionState, variables: { id }, fetchPolicy: 'network-only' });
  const current = r.data?.getCollection;
  return (
    !r.error &&
    !!current &&
    current.name === expected.name &&
    current.description === (expected.description ?? null) &&
    current.parentId === (expected.parentId ?? null)
  );
}
