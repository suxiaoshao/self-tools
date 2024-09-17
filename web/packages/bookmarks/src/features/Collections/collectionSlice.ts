/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-08-29 16:36:31
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-09-08 14:07:12
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Collections/collectionSlice.ts
 */
import { AllCollectionsQuery, useAllCollectionsLazyQuery } from '@bookmarks/graphql';
import { Enum } from 'types';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useEffect } from 'react';

export type AllCollectionItem = AllCollectionsQuery['allCollections'][0];

export enum CollectionLoadingState {
  init,
  loading,
  state,
  error,
}

export interface CollectionTreeItem {
  name: string;
  id: number;
  path: string;
  createTime: string;
  updateTime: string;
  description?: string | null;
  children: CollectionTreeItem[];
}

export type CollectionData =
  | Enum<CollectionLoadingState.init>
  | Enum<CollectionLoadingState.loading>
  | Enum<CollectionLoadingState.state, Map<number, AllCollectionItem>>
  | Enum<CollectionLoadingState.error, Error>;

export interface CollectionSliceType {
  value: CollectionData;

  setAllCollections(allCollection: AllCollectionItem[]): void;

  setLoading(): void;

  setError(error: Error): void;
}

const getDefault = () => ({ tag: CollectionLoadingState.init }) satisfies CollectionData;

export const useCollectionsStore = create<CollectionSliceType>((set) => ({
  value: getDefault(),
  setAllCollections: (allCollection: AllCollectionItem[]) =>
    set({
      value: {
        tag: CollectionLoadingState.state,
        value: new Map(allCollection.map((item) => [item.id, item])),
      },
    }),
  setLoading: () => set({ value: { tag: CollectionLoadingState.loading } }),
  setError: (error: Error) => set({ value: { tag: CollectionLoadingState.error, value: error } }),
}));

export function useAllCollection() {
  const { value, setAllCollections, setLoading, setError } = useCollectionsStore(
    useShallow((state) => ({
      value: state.value,
      setAllCollections: state.setAllCollections,
      setLoading: state.setLoading,
      setError: state.setError,
    })),
  );
  const [fn] = useAllCollectionsLazyQuery();
  const fetchData = useCallback(async () => {
    setLoading();
    const { data, loading, error } = await fn();
    if (data) {
      setAllCollections(data.allCollections);
    }
    if (loading) {
      setLoading();
    }
    if (error) {
      setError(error);
    }
  }, [fn, setAllCollections, setLoading, setError]);
  useEffect(() => {
    if (value.tag === CollectionLoadingState.init) {
      fetchData();
    }
  }, [fetchData, value]);

  return {
    value,
    fetchData,
  };
}
