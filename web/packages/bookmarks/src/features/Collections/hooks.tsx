import { useDeleteCollectionMutation } from '@bookmarks/graphql';
import { Link } from '@mui/material';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';
import { format } from 'time';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  type CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import type { CollectionTableData } from './types';

const columnHelper = createCustomColumnHelper<CollectionTableData>();

export function useCollectionTable(refetch: () => Promise<unknown>, data: CollectionTableData[]) {
  const [deleteCollection] = useDeleteCollectionMutation();

  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<CollectionTableData>>(
    () =>
      [
        columnHelper.accessor(
          ({ name, id }) => (
            <Link component={RouterLink} to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>
              {name}
            </Link>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor('path', {
          header: t('path'),
          id: 'path',
        }),
        columnHelper.accessor(({ description }) => description ?? '-', {
          header: t('description'),
          id: 'description',
          cellProps: {
            align: 'center',
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {(onClose) => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteCollection({ variables: { id } });
                    onClose();
                    await refetch();
                  },
                },
              ]}
            </TableActions>
          ),
          {
            header: t('actions'),
            id: 'action',
            cellProps: { padding: 'none' },
            cell: (context) => context.getValue(),
          },
        ),
      ] as CustomColumnDefArray<CollectionTableData>,
    [deleteCollection, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<CollectionTableData>>(
    () => ({ columns, data, getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);
  return tableInstance;
}
