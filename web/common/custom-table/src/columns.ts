import {
  type ColumnDef,
  type ColumnHelper,
  createColumnHelper,
  metaHelper,
  type RowData,
  tableFeatures,
  type TableOptions,
} from '@tanstack/react-table';
import type { ComponentProps } from 'react';

interface CellPresentation {
  cellProps?: ComponentProps<'td'>;
  headerCellProps?: ComponentProps<'th'>;
}

export const features = tableFeatures({ columnMeta: metaHelper<CellPresentation>() });
type Features = typeof features;

export type CustomColumnDef<T extends RowData, TValue = unknown> = ColumnDef<Features, T, TValue>;
export type CustomColumnDefArray<T extends RowData> = ReturnType<ColumnHelper<Features, T>['columns']>;
export type CustomTableOptions<T extends RowData> = Omit<TableOptions<Features, T>, 'features'>;

export function createCustomColumnHelper<T extends RowData>() {
  return createColumnHelper<Features, T>();
}
