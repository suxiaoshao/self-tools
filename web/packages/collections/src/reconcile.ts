import type { ApolloClient } from '@apollo/client';
import { graphql } from './gql';
const ReadItemState = graphql(`
  query ReadItemState($id: Int!) {
    getItem(id: $id) {
      id
      name
      content
      collections {
        id
      }
    }
  }
`);
const ReadCollectionState = graphql(`
  query ReadCollectionState($id: Int!) {
    getCollection(id: $id) {
      id
      name
      description
    }
  }
`);
export async function checkItem(client: ApolloClient, id: number, expected: { name: string; content: string }) {
  const response = await client.query({ query: ReadItemState, variables: { id } });
  return (
    !response.error &&
    response.data?.getItem?.name === expected.name &&
    response.data?.getItem?.content === expected.content
  );
}
export async function checkCollection(
  client: ApolloClient,
  id: number,
  expected: { name: string; description?: string | null },
) {
  const response = await client.query({ query: ReadCollectionState, variables: { id } });
  return (
    !response.error &&
    response.data?.getCollection?.name === expected.name &&
    response.data?.getCollection?.description === (expected.description ?? null)
  );
}
export async function checkDeleted(client: ApolloClient, id: number, kind: 'Item' | 'Collection') {
  if (kind === 'Item') {
    const response = await client.query({ query: ReadItemState, variables: { id } });
    return !response.error && response.data?.getItem === null;
  }
  const response = await client.query({ query: ReadCollectionState, variables: { id } });
  return !response.error && response.data?.getCollection === null;
}
export async function checkMembership(client: ApolloClient, itemId: number, collectionId: number, present: boolean) {
  const response = await client.query({ query: ReadItemState, variables: { id: itemId } });
  if (response.error || !response.data) return false;
  if (response.data.getItem === null) return !present;
  const collections = response.data.getItem.collections;
  return !!collections && collections.some((c) => c.id === collectionId) === present;
}
