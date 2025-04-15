import { useDeleteCollectionMutation } from '@bookmarks/graphql';
import { Link } from '@mui/material';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';
import { format } from 'time';
import {
  type CustomColumnDefArray,
  type CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import type { CollectionTableData } from './types';

export function useCollectionTable(refetch: () => Promise<unknown>, data: CollectionTableData[]) {
  const [deleteCollection] = useDeleteCollectionMutation();

  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<CollectionTableData>>(
    () => [
      {
        header: t('name'),
        id: 'name',
        accessorFn: ({ name, id }) => (
          <Link component={RouterLink} to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>
            {name}
          </Link>
        ),
        cell: (context) => context.getValue(),
      },
      {
        header: t('path'),
        id: 'path',
        accessorKey: 'path',
      },
      {
        header: t('description'),
        id: 'description',
        accessorFn: ({ description }) => description ?? '-',
        cellProps: {
          align: 'center',
        },
        cell: (context) => context.getValue(),
      },
      {
        header: t('create_time'),
        id: 'createTime',
        accessorFn: ({ createTime }) => format(createTime),
        cell: (context) => context.getValue(),
      },
      {
        header: t('update_time'),
        id: 'updateTime',
        accessorFn: ({ updateTime }) => format(updateTime),
        cell: (context) => context.getValue(),
      },
      {
        header: t('actions'),
        id: 'action',
        accessorFn: ({ id }) => (
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
        cellProps: { padding: 'none' },
        cell: (context) => context.getValue(),
      },
    ],
    [deleteCollection, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<CollectionTableData>>(
    () => ({ columns, data, getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);
  return tableInstance;
}
