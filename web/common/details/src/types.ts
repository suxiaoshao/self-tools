import type { Key, ReactNode } from 'react';

export interface DetailsItem {
  key?: Key;
  label: string;
  value: ReactNode;
  span?: 1 | 2 | 3;
}
