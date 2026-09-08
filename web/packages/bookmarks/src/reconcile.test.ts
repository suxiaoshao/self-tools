import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { checkDeleted, checkNovelState } from './reconcile';
function client(data: Record<string, unknown>, failed = false) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      () =>
        new Observable((observer) => {
          observer.next({
            data,
            errors: failed ? [{ message: 'private source', path: ['getNovel', 'chapters'] }] : undefined,
          });
          observer.complete();
        }),
    ),
    defaultOptions: {
      query: { errorPolicy: 'all' },
      watchQuery: { errorPolicy: 'all' },
      mutate: { errorPolicy: 'none' },
    },
  });
}
describe('bookmarks read-only reconciliation', () => {
  it('only confirms absence after an error-free response', async () => {
    expect(await checkDeleted(client({ getNovel: null }), 3, 'Novel')).toBe(true);
    expect(await checkDeleted(client({ getNovel: null }, true), 3, 'Novel')).toBe(false);
  });
  it('checks every requested reading state and never treats a failed association as empty', async () => {
    const novel = {
      __typename: 'Novel',
      id: 3,
      comments: null,
      collections: [],
      chapters: [
        { __typename: 'Chapter', id: 4, isRead: true },
        { __typename: 'Chapter', id: 5, isRead: false },
      ],
    };
    expect(await checkNovelState(client({ getNovel: novel }), 3, { read: [4], unread: [5] })).toBe(true);
    expect(await checkNovelState(client({ getNovel: novel }), 3, { read: [4, 5], unread: [] })).toBe(false);
    expect(
      await checkNovelState(client({ getNovel: { ...novel, chapters: null } }, true), 3, { read: [], unread: [5] }),
    ).toBe(false);
  });
});
