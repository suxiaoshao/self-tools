import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';
import { clearAuthenticatedState, getClient } from 'custom-graphql';
import {
  CollectionsProvider,
  useAllCollection,
  CollectionLoadingState,
} from '../../packages/collections/src/entities/collection';
import {
  CollectionsProvider as BookmarksProvider,
  useAllCollection as useBookmarks,
} from '../../packages/bookmarks/src/entities/collection';

afterEach(() => {
  cleanup();
  clearAuthenticatedState();
  vi.unstubAllGlobals();
});
const response = (id: number) =>
  new Response(
    JSON.stringify({
      data: {
        allCollections: [
          {
            __typename: 'Collection',
            id,
            name: `collection ${id}`,
            path: `/${id}/`,
            description: null,
            parentId: null,
            createTime: '2026-09-08',
            updateTime: '2026-09-08',
          },
        ],
      },
    }),
    { headers: { 'content-type': 'application/json' } },
  );

describe.each([
  ['collections', CollectionsProvider, useAllCollection],
  ['bookmarks', BookmarksProvider, useBookmarks],
] as const)('%s', (name, Provider, useCollections) => {
  it('shares one query and discards a superseded same-session response', async () => {
    const pending: ((value: Response) => void)[] = [];
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          pending.push(resolve);
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const client = getClient(`/api/${name}/graphql`);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>
        <Provider>{children}</Provider>
      </ApolloProvider>
    );
    const { result } = renderHook(() => [useCollections(), useCollections()] as const, { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    let refresh!: Promise<void>;
    act(() => {
      refresh = result.current[0].fetchData();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await act(async () => {
      pending[1](response(2));
      await refresh;
    });
    await waitFor(() => expect(result.current[0].value.tag).toBe(CollectionLoadingState.state));
    const newer = result.current[0].value;
    expect(newer.tag === CollectionLoadingState.state && [...newer.value.keys()]).toEqual([2]);
    expect(result.current[1]).toBe(result.current[0]);
    await act(async () => {
      pending[0](response(1));
    });
    expect(result.current[0].value).toBe(newer);
    expect(client.cache.extract()).toEqual({});
  });

  it('drops the previous authenticated session snapshot and its pending response on remount', async () => {
    const pending: ((value: Response) => void)[] = [];
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          pending.push(resolve);
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const client = getClient(`/api/${name}/graphql`);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>
        <Provider>{children}</Provider>
      </ApolloProvider>
    );
    const old = renderHook(useCollections, { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      pending[0](response(1));
    });
    await waitFor(() => expect(old.result.current.value.tag).toBe(CollectionLoadingState.state));
    act(() => {
      void old.result.current.fetchData();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    old.unmount();
    await act(async () => {
      clearAuthenticatedState();
    });
    const fresh = renderHook(useCollections, { wrapper });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fresh.result.current.value.tag).toBe(CollectionLoadingState.loading);
    await act(async () => {
      pending[2](response(3));
    });
    await waitFor(() => expect(fresh.result.current.value.tag).toBe(CollectionLoadingState.state));
    const current = fresh.result.current.value;
    await act(async () => {
      pending[1](response(2));
    });
    expect(fresh.result.current.value).toBe(current);
    expect(current.tag === CollectionLoadingState.state && [...current.value.keys()]).toEqual([3]);
  });

  it('exposes refresh failure to every consumer and allows a fresh read to recover', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response(1))
        .mockRejectedValueOnce(new TypeError('network unavailable'))
        .mockResolvedValueOnce(response(3)),
    );
    const client = getClient(`/api/${name}/graphql`);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApolloProvider client={client}>
        <Provider>{children}</Provider>
      </ApolloProvider>
    );
    const { result } = renderHook(useCollections, { wrapper });
    await waitFor(() => expect(result.current.value.tag).toBe(CollectionLoadingState.state));
    await act(async () => {
      await result.current.fetchData();
    });
    expect(result.current.value.tag).toBe(CollectionLoadingState.error);
    await act(async () => {
      await result.current.fetchData();
    });
    const recovered = result.current.value;
    expect(recovered.tag === CollectionLoadingState.state && [...recovered.value.keys()]).toEqual([3]);
  });
});
