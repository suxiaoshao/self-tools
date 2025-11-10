'use no memo';
import { type Table as TableType, flexRender } from '@tanstack/react-table';
import type { CustomColumnDef } from './useCustomTable';
import type { PageWithTotal } from './usePage';
import { match } from 'ts-pattern';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@portal/components/ui/table';
import { cn } from '@portal/lib/utils';
import type { ComponentProps } from 'react';
import TablePagination from './TablePagination';

export interface CustomTableProps<D extends object> extends Omit<ComponentProps<'table'>, 'ref'> {
  tableInstance: TableType<D>;
  page?: PageWithTotal;
  containerProps?: ComponentProps<'div'>;
}

export function CustomTable<D extends object>({
  tableInstance,
  page,
  containerProps,
  className,
  ...tableProps
}: CustomTableProps<D>) {
  const { getHeaderGroups, getRowModel } = tableInstance;
  return (
    <div
      className={cn('grow shrink-0 basis-0 flex flex-col max-h-full overflow-y-auto', className)}
      {...containerProps}
    >
      <Table {...tableProps}>
        <TableHeader>
          {
            // Loop over the header rows
            getHeaderGroups().map((headerGroup) => (
              // Apply the header row props
              <TableRow key={headerGroup.id}>
                {
                  // Loop over the headers in each row
                  headerGroup.headers.map((header) => {
                    const headerColumn = header.column.columnDef as CustomColumnDef<D>;
                    const headerProps = headerColumn.headerCellProps ?? headerColumn.cellProps ?? {};

                    return (
                      // Apply the header cell props
                      <TableHead colSpan={header.colSpan} key={header.id} {...headerProps}>
                        {match(header.isPlaceholder)
                          .with(true, () => null)
                          .with(false, () => flexRender(header.column.columnDef.header, header.getContext()))
                          .exhaustive()}
                      </TableHead>
                    );
                  })
                }
              </TableRow>
            ))
          }
        </TableHeader>
        {/* Apply the table body props */}
        <TableBody className="flex-1">
          {
            // Loop over the table rows
            getRowModel().rows.map((row) => {
              // Prepare the row for display

              return (
                // Apply the row props
                <TableRow key={row.id}>
                  {
                    // Loop over the rows cells
                    row.getVisibleCells().map((cell) => {
                      const column = cell.column.columnDef as CustomColumnDef<D>;

                      // Apply the cell props
                      return (
                        <TableCell key={cell.id} {...column.cellProps}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })
                  }
                </TableRow>
              );
            })
          }
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
  useCustomTable,
  type CustomColumnDef,
  type CustomColumnDefArray,
  type CustomColumnHelper,
  type CustomExtendsType,
  type CustomTableOptions,
} from './useCustomTable';

export { default as TablePagination } from './TablePagination';

export { getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table';
