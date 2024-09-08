import { Enum } from 'types';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

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
  description: string;
  children: CollectionTreeItem[];
}

export type CollectionSliceType =
  | Enum<CollectionLoadingState.init>
  | Enum<CollectionLoadingState.loading>
  | Enum<CollectionLoadingState.state, CollectionTreeItem[]>
  | Enum<CollectionLoadingState.error, Error>;
const getDefault = () => ({ tag: CollectionLoadingState.init }) satisfies CollectionSliceType;
const useBearStore = create<CollectionSliceType>((set) => ({
  ...getDefault(),
}));
