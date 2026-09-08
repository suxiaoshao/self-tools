import type { ApolloClient } from '@apollo/client';
import { graphql } from './gql';
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
const ReadAuthorState = graphql(`
  query ReadBookmarkAuthorState($id: Int!) {
    getAuthor(id: $id) {
      id
    }
  }
`);
const ReadTagsState = graphql(`
  query ReadBookmarkTagsState {
    allTags {
      id
    }
  }
`);
export async function checkDeleted(client: ApolloClient, id: number, kind: 'Novel' | 'Author' | 'Tag' | 'Collection') {
  switch (kind) {
    case 'Novel': {
      const r = await client.query({ query: ReadNovelState, variables: { id }, fetchPolicy: 'network-only' });
      return !r.error && r.data?.getNovel === null;
    }
    case 'Author': {
      const r = await client.query({ query: ReadAuthorState, variables: { id }, fetchPolicy: 'network-only' });
      return !r.error && r.data?.getAuthor === null;
    }
    case 'Collection': {
      const r = await client.query({ query: ReadCollectionState, variables: { id }, fetchPolicy: 'network-only' });
      return !r.error && r.data?.getCollection === null;
    }
    case 'Tag': {
      const r = await client.query({ query: ReadTagsState, fetchPolicy: 'network-only' });
      return !r.error && !!r.data?.allTags && !r.data.allTags.some((t) => t.id === id);
    }
  }
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
