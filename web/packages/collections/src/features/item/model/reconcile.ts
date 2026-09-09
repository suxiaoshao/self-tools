import type { ApolloClient } from '@apollo/client';
import { graphql } from '@collections/gql/index';
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
export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadItemState, variables: { id } });
  return !response.error && response.data?.getItem === null;
}
export async function checkItem(client: ApolloClient, id: number, expected: { name: string; content: string }) {
  const response = await client.query({ query: ReadItemState, variables: { id } });
  return (
    !response.error &&
    response.data?.getItem?.name === expected.name &&
    response.data?.getItem?.content === expected.content
  );
}
export async function checkMembership(client: ApolloClient, itemId: number, collectionId: number, present: boolean) {
  const response = await client.query({ query: ReadItemState, variables: { id: itemId } });
  if (response.error || !response.data) return false;
  if (response.data.getItem === null) return !present;
  const collections = response.data.getItem.collections;
  return !!collections && collections.some((c) => c.id === collectionId) === present;
}
