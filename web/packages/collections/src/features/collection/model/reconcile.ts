import type { ApolloClient } from '@apollo/client';
import { ReadCollectionStateDocument as ReadCollectionState } from '@collections/gql/graphql';

export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadCollectionState, variables: { id } });
  return !response.error && response.data?.getCollection === null;
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
