import { useTable, flexRender } from '@tanstack/react-table';
import { features, type CustomTableOptions } from './columns';
import type { PageWithTotal } from './usePage';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui/components/table';
import { cn } from 'ui/lib/utils';
import type { ComponentProps } from 'react';
import TablePagination from './TablePagination';

export interface CustomTableProps<D extends object> extends Omit<ComponentProps<'table'>, 'ref'> {
  options: CustomTableOptions<D>;
  page?: PageWithTotal;
  containerProps?: ComponentProps<'div'>;
}

export function CustomTable<D extends object>({
  options,
  page,
  containerProps,
  className,
  ...tableProps
}: CustomTableProps<D>) {
  const table = useTable({ ...options, features });
  return (
    <div
      className={cn('relative grow shrink-0 basis-0 flex flex-col max-h-full overflow-y-auto', className)}
      {...containerProps}
    >
      <Table {...tableProps}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                return (
                  <TableHead colSpan={header.colSpan} key={header.id} {...(meta?.headerCellProps ?? meta?.cellProps)}>
                    {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="flex-1">
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} {...cell.column.columnDef.meta?.cellProps}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {page && page.total > page.pageSize && <TablePagination {...page} />}
    </div>
  );
}

export { usePage, usePageWithTotal, type PageState } from './usePage';

export { TableActions } from './TableActions';
export {
  createCustomColumnHelper,
  type CustomColumnDef,
  type CustomColumnDefArray,
  type CustomTableOptions,
} from './columns';

export { default as TablePagination } from './TablePagination';
