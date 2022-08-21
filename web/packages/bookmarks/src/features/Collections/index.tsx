import { Box, IconButton, Link } from '@mui/material';
import { GetCollectionListQuery, useDeleteCollectionMutation, useGetCollectionListQuery } from '../../graphql';
import { useMemo } from 'react';
import { CustomColumnArray, TableActions, CustomTable, useCustomTable } from 'custom-table';
import { format } from 'time';
import { Refresh } from '@mui/icons-material';
import CreateCollectionButton from './components/CreateCollectionButton';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './components/useParentId';

export default function Home() {
  const parentId = useParentId();
  const { data: { getCollectionList } = {}, refetch } = useGetCollectionListQuery({ variables: { parentId } });
  const [deleteCollection] = useDeleteCollectionMutation();

  const columns = useMemo<CustomColumnArray<GetCollectionListQuery['getCollectionList'][0]>>(
    () => [
      {
        Header: '名字',
        id: 'name',
        accessor: ({ name, id }) => (
          <Link component={RouterLink} to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>
            {name}
          </Link>
        ),
      },
      {
        Header: '路径',
        id: 'path',
        accessor: 'path',
      },
      {
        Header: '描述',
        id: 'description',
        accessor: ({ description }) => description ?? '-',
        cellProps: {
          align: 'center',
        },
      },
      {
        Header: '创建时间',
        id: 'createTime',
        accessor: ({ createTime }) => format(createTime),
      },
      {
        Header: '更新时间',
        id: 'updateTime',
        accessor: ({ updateTime }) => format(updateTime),
      },
      {
        Header: '操作',
        id: 'action',
        accessor: ({ id }) => (
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
      },
    ],
    [deleteCollection, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: getCollectionList ?? [] });

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
        <CreateCollectionButton reFetch={refetch} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
