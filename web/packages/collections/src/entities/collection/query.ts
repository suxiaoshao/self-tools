import { createContext, createElement, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { RequestError } from 'request-errors';
import { graphql } from '@collections/gql/index';
import type { AllCollectionsQuery } from '@collections/gql/graphql';

const AllCollections = graphql(`
  query allCollections {
    allCollections {
      name
      id
      path
      createTime
      updateTime
      description
      parentId
    }
  }
`);

type AllCollectionItem = AllCollectionsQuery['allCollections'][number];

export enum CollectionLoadingState {
  init = 0,
  loading,
  state,
  error,
}

type CollectionData =
  | { tag: CollectionLoadingState.init | CollectionLoadingState.loading }
  | { tag: CollectionLoadingState.state; value: Map<number, AllCollectionItem> }
  | { tag: CollectionLoadingState.error; value: unknown };

type CollectionQuery = { value: CollectionData; fetchData: () => Promise<void> };
const CollectionContext = createContext<CollectionQuery | null>(null);

/** One Apollo observable owns the snapshot and request state for every tree consumer. */
export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [execute, { data, error, loading, called }] = useLazyQuery(AllCollections, { fetchPolicy: 'no-cache' });
  const fetchData = useCallback(async () => {
    // A post-write refresh must start a new request, even if an older read is pending.
    // Re-executing this observable cancels its previous execution; do not retain it.
    await execute({ context: { queryDeduplication: false } }).catch(() => undefined);
  }, [execute]);
  useEffect(() => {
    void fetchData();
  }, [fetchData]);
  const value = useMemo<CollectionData>(() => {
    if (!called) return { tag: CollectionLoadingState.init };
    if (loading) return { tag: CollectionLoadingState.loading };
    if (error) return { tag: CollectionLoadingState.error, value: error };
    if (!data) return { tag: CollectionLoadingState.error, value: new RequestError({ kind: 'protocol' }) };
    return { tag: CollectionLoadingState.state, value: new Map(data.allCollections.map((item) => [item.id, item])) };
  }, [called, loading, error, data]);
  const context = useMemo(() => ({ value, fetchData }), [value, fetchData]);
  return createElement(CollectionContext.Provider, { value: context }, children);
}

export function useAllCollection() {
  const context = useContext(CollectionContext);
  if (!context) throw new Error('CollectionsProvider is required');
  return context;
}
