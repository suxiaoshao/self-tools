'use no memo';
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  type TableContainerProps,
  TablePagination,
  TableFooter,
  TablePaginationActions,
} from '@mui/material';
import { type Table as TableType, flexRender } from '@tanstack/react-table';
import type { CustomColumnDef } from './useCustomTable';
import type { PageWithTotal } from './usePage';
import { match } from 'ts-pattern';

export interface CustomTableProps<D extends object> extends Omit<TableContainerProps, 'ref'> {
  tableInstance: TableType<D>;
  page?: PageWithTotal;
  containerProps?: TableContainerProps;
}

export function CustomTable<D extends object>({
  tableInstance,
  page,
  containerProps,
  sx,
  ...tableProps
}: CustomTableProps<D>) {
  const { getHeaderGroups, getRowModel } = tableInstance;
  return (
    <TableContainer
      sx={{
        flex: '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        overflowY: 'auto',
        ...sx,
      }}
      component={Paper}
      {...containerProps}
    >
      <Table {...tableProps}>
        <TableHead>
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
                      <TableCell colSpan={header.colSpan} key={header.id} {...headerProps}>
                        {match(header.isPlaceholder)
                          .with(true, () => null)
                          .with(false, () => flexRender(header.column.columnDef.header, header.getContext()))
                          .exhaustive()}
                      </TableCell>
                    );
                  })
                }
              </TableRow>
            ))
          }
        </TableHead>
        {/* Apply the table body props */}
        <TableBody sx={{ flex: '1 1 0' }}>
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
        {page && page.total > page.pageSize && (
          <TableFooter>
            <TableRow>
              <TablePagination
                count={page.total}
                rowsPerPage={page.pageSize}
                page={page.pageIndex - 1}
                onPageChange={(_, p) => {
                  page.setPage(p + 1);
                }}
                ActionsComponent={TablePaginationActions}
                rowsPerPageOptions={page.pageSizeOptions}
                onRowsPerPageChange={(event) => {
                  page.setPageSize(Number.parseInt(event.target.value, 10));
                  page.setPage(1);
                }}
              />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </TableContainer>
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

export { getCoreRowModel } from '@tanstack/react-table';
