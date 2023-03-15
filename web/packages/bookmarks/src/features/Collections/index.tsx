import { Box, IconButton, Link } from '@mui/material';
import { GetCollectionsQuery, useDeleteCollectionMutation, useGetCollectionsQuery } from '../../graphql';
import { useMemo } from 'react';
import { CustomColumnArray, TableActions, CustomTable, useCustomTable, getCoreRowModel } from 'custom-table';
import { format } from 'time';
import { Refresh } from '@mui/icons-material';
import CreateCollectionButton from './components/CreateCollectionButton';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './components/useParentId';

export default function Home() {
  const parentId = useParentId();
  const { data: { getCollections } = {}, refetch } = useGetCollectionsQuery({ variables: { parentId } });
  const [deleteCollection] = useDeleteCollectionMutation();

  const columns = useMemo<CustomColumnArray<GetCollectionsQuery['getCollections'][0]>>(
    () => [
      {
        header: '名字',
        id: 'name',
        accessorFn: ({ name, id }) => (
          <Link component={RouterLink} to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>
            {name}
          </Link>
        ),
        cell: (context) => context.getValue(),
      },
      {
        header: '路径',
        id: 'path',
        accessorKey: 'path',
      },
      {
        header: '描述',
        id: 'description',
        accessorFn: ({ description }) => description ?? '-',
        cellProps: {
          align: 'center',
        },
        cell: (context) => context.getValue(),
      },
      {
        header: '创建时间',
        id: 'createTime',
        accessorFn: ({ createTime }) => format(createTime),
        cell: (context) => context.getValue(),
      },
      {
        header: '更新时间',
        id: 'updateTime',
        accessorFn: ({ updateTime }) => format(updateTime),
        cell: (context) => context.getValue(),
      },
      {
        header: '操作',
        id: 'action',
        accessorFn: ({ id }) => (
          <TableActions>
            {(onClose) => [
              {
                text: '删除',
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
    [deleteCollection, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: getCollections ?? [], getCoreRowModel: getCoreRowModel() });

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
