import { TableCellProps } from '@mui/material';
import {
  ColumnDef,
  RowData,
  TableOptions,
  useReactTable,
  Table,
  AccessorFn,
  DeepKeys,
  DeepValue,
  DisplayColumnDef,
  GroupColumnDef,
  IdentifiedColumnDef,
} from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';

export type CustomExtendsType = {
  cellProps?: TableCellProps;
  headerCellProps?: TableCellProps;
};
export type CustomColumnDef<T extends RowData, TValue = unknown> = ColumnDef<T, TValue> & CustomExtendsType;

export type CustomColumnDefArray<T extends RowData> = CustomColumnDef<T>[];

export type CustomTableOptions<T extends RowData> = Omit<TableOptions<T>, 'columns'> & {
  columns: CustomColumnDefArray<T>;
};

export function useCustomTable<D extends RowData>(options: CustomTableOptions<D>): Table<D> {
  return useReactTable(options);
}

export function createCustomColumnHelper<TData extends RowData>(): CustomColumnHelper<TData> {
  return createColumnHelper<TData>();
}

export type CustomColumnHelper<TData extends RowData> = {
  accessor: <
    TAccessor extends AccessorFn<TData> | DeepKeys<TData>,
    TValue extends TAccessor extends AccessorFn<TData, infer TReturn>
      ? TReturn
      : TAccessor extends DeepKeys<TData>
        ? DeepValue<TData, TAccessor>
        : never,
  >(
    accessor: TAccessor,
    column: (TAccessor extends AccessorFn<TData>
      ? DisplayColumnDef<TData, TValue>
      : IdentifiedColumnDef<TData, TValue>) &
      CustomExtendsType,
  ) => CustomColumnDef<TData, TValue>;
  display: (column: DisplayColumnDef<TData>) => CustomColumnDef<TData, unknown> & CustomExtendsType;
  group: (column: GroupColumnDef<TData>) => CustomColumnDef<TData, unknown> & CustomExtendsType;
};
