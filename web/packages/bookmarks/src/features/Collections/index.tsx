import { Box, Button, CircularProgress, IconButton, Link } from '@mui/material';
import { GetCollectionsQuery, useDeleteCollectionMutation, useGetCollectionsQuery } from '../../graphql';
import { useMemo } from 'react';
import {
  CustomColumnDefArray,
  TableActions,
  CustomTable,
  useCustomTable,
  getCoreRowModel,
  CustomTableOptions,
} from 'custom-table';
import { format } from 'time';
import { Refresh } from '@mui/icons-material';
import CreateCollectionButton from './components/CreateCollectionButton';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './components/useParentId';
import { useI18n } from 'i18n';
import { CollectionLoadingState, useAllCollection } from './collectionSlice';
import { match } from 'ts-pattern';
import CollectionTree from './components/CollectionTree';
import { getCollectionTreeFromCollectionList } from './utils';

type Data = GetCollectionsQuery['getCollections'][0];

export default function Collections() {
  const parentId = useParentId();
  const { data, refetch } = useGetCollectionsQuery({ variables: { parentId } });
  const [deleteCollection] = useDeleteCollectionMutation();
  const t = useI18n();

  const columns = useMemo<CustomColumnDefArray<Data>>(
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
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data?.getCollections ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data?.getCollections],
  );
  const tableInstance = useCustomTable(tableOptions);

  const { value, fetchData } = useAllCollection();
  const tree = useMemo(
    () =>
      match(value)
        .with({ tag: CollectionLoadingState.init }, () => null)
        .with({ tag: CollectionLoadingState.error }, ({ value }) => (
          <Box>
            {value.toString()} <Button onClick={fetchData}>{t('refresh')}</Button>
          </Box>
        ))
        .with({ tag: CollectionLoadingState.loading }, () => <CircularProgress />)
        .with({ tag: CollectionLoadingState.state }, ({ value }) => (
          <CollectionTree value={getCollectionTreeFromCollectionList(value.values())} />
        ))
        .otherwise(() => null),
    [value, t],
  );

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
      {tree}
    </Box>
  );
}
