import { Refresh } from '@mui/icons-material';
import { Box, IconButton, Link } from '@mui/material';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  useCustomTable,
} from 'custom-table';
import { useCallback, useMemo } from 'react';
import { useGetCollectionsQuery } from '../../graphql';
import { useAllCollection } from './collectionSlice';
import AncestorsPath from './components/AncestorsPath';
import CreateCollectionButton from './components/CreateCollectionButton';
import useParentId from './components/useParentId';
import type { CollectionTableData } from './types';
import { useI18n } from 'i18n';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';
import { format } from 'time';
import CollectionActions from './components/CollectionActions';

const columnHelper = createCustomColumnHelper<CollectionTableData>();

export default function Collections() {
  const parentId = useParentId();
  const { data, refetch } = useGetCollectionsQuery({ variables: { parentId } });
  const { fetchData } = useAllCollection();

  const allRefetch = useCallback(async () => {
    await Promise.all([refetch(), fetchData()]);
  }, [refetch, fetchData]);

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
        columnHelper.accessor(({ description }) => description || '-', {
          header: t('description'),
          id: 'description',
          cellProps: {
            align: 'center',
          },
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
        }),
        columnHelper.accessor((data) => <CollectionActions {...data} refetch={allRefetch} />, {
          header: t('actions'),
          id: 'action',
          cellProps: { padding: 'none' },
          cell: (context) => context.getValue(),
        }),
      ] as CustomColumnDefArray<CollectionTableData>,
    [allRefetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<CollectionTableData>>(
    () => ({ columns, data: data?.getCollections ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data?.getCollections],
  );
  const tableInstance = useCustomTable(tableOptions);

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <AncestorsPath />
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <CreateCollectionButton refetch={refetch} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
