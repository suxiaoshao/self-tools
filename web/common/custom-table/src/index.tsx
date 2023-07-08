import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainerProps,
  TablePagination,
  TableFooter,
} from '@mui/material';
import TablePaginationActions from '@mui/material/TablePagination/TablePaginationActions';
import { Table as TableType, flexRender } from '@tanstack/react-table';
import { CustomColumnDef } from './useCustomTable';
import { PageWithTotal } from './usePage';

export interface CustomTableProps<D extends object> extends Omit<TableContainerProps, 'ref'> {
  tableInstance: TableType<D>;
  page?: PageWithTotal;
  containerProps?: TableContainerProps;
}

export function CustomTable<D extends object>({
  tableInstance,
  page,
  containerProps,
  ...tableProps
}: CustomTableProps<D>): JSX.Element {
  const { getHeaderGroups, getRowModel } = tableInstance;
  return (
    <TableContainer
      sx={{
        overflow: 'hidden',
        flex: '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
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
                      <TableCell colSpan={header.colSpan} {...headerProps} key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                        <TableCell {...column.cellProps} key={cell.id}>
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
                page={page.pageIndex}
                onPageChange={(_, p) => {
                  page.setPage(p);
                }}
                ActionsComponent={TablePaginationActions}
                rowsPerPageOptions={page.pageSizeOptions}
                onRowsPerPageChange={(event) => {
                  page.setPageSize(parseInt(event.target.value, 10));
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

export * from './usePage';

export * from './TableActions';
export * from './useCustomTable';

export { getCoreRowModel } from '@tanstack/react-table';
