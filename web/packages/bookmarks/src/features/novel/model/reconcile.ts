import type { ApolloClient } from '@apollo/client';
import { graphql } from '@bookmarks/gql/index';
const ReadNovelState = graphql(`
  query ReadBookmarkNovelState($id: Int!) {
    getNovel(id: $id) {
      id
      comments {
        content
      }
      collections {
        id
      }
      chapters {
        id
        isRead
      }
    }
  }
`);
export async function checkDeleted(client: ApolloClient, id: number) {
  const response = await client.query({ query: ReadNovelState, variables: { id }, fetchPolicy: 'network-only' });
  return !response.error && response.data?.getNovel === null;
}
export async function checkNovelState(
  client: ApolloClient,
  id: number,
  expected:
    | { comment: string | null }
    | { collectionId: number; present: boolean }
    | { read: readonly number[]; unread: readonly number[] },
) {
  const r = await client.query({ query: ReadNovelState, variables: { id }, fetchPolicy: 'network-only' });
  if (r.error || !r.data) return false;
  const novel = r.data.getNovel;
  if (!novel) return 'comment' in expected ? expected.comment === null : 'present' in expected && !expected.present;
  if ('comment' in expected) return (novel.comments?.content ?? null) === expected.comment;
  if ('collectionId' in expected)
    return !!novel.collections && novel.collections.some((c) => c.id === expected.collectionId) === expected.present;
  const chapters = novel.chapters;
  return (
    !!chapters &&
    expected.read.every((id) => chapters.some((c) => c.id === id && c.isRead)) &&
    expected.unread.every((id) => chapters.some((c) => c.id === id && !c.isRead))
  );
}
