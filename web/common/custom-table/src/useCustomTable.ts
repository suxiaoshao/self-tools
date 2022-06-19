import { TableCellProps } from '@mui/material';
import { Column, PluginHook, TableInstance, TableOptions, useTable } from 'react-table';

export type CustomColumn<T extends object> = Column<T> & {
  cellProps?: TableCellProps;
  headerCellProps?: TableCellProps;
};

export type CustomColumnArray<T extends object> = ReadonlyArray<CustomColumn<T>>;

export type CustomTableOptions<T extends object> = Omit<TableOptions<T>, 'columns'> & {
  columns: CustomColumnArray<T>;
};
export function useCustomTable<D extends object>(
  options: CustomTableOptions<D>,
  ...plugins: Array<PluginHook<D>>
): TableInstance<D> {
  return useTable(options, ...plugins);
}
