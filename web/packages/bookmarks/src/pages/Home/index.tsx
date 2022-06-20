import { Box, IconButton } from '@mui/material';
import { GetDirectoryListQuery, useDeleteDirectoryMutation, useGetDirectoryListQuery } from '../../graphql';
import {} from 'jotai';
import { useMemo } from 'react';
import { CustomColumnArray, TableActions, CustomTable, useCustomTable } from 'custom-table';
import { format } from 'time';
import { Refresh } from '@mui/icons-material';
import CreateDirButton from './components/CreateDIrButton';

export default function Home() {
  const { data: { getDirectoryList } = {}, refetch } = useGetDirectoryListQuery({ variables: { fatherPath: '/' } });
  const [deleteDir] = useDeleteDirectoryMutation();
  const columns = useMemo<CustomColumnArray<GetDirectoryListQuery['getDirectoryList'][0]>>(
    () => [
      {
        Header: '路径',
        id: 'path',
        accessor: 'path',
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
        accessor: ({ path }) => (
          <TableActions>
            {(onClose) => [
              {
                text: '删除',
                onClick: async () => {
                  await deleteDir({ variables: { dirPath: path } });
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
    [deleteDir, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: getDirectoryList ?? [] });

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          marginTop: 2,
          display: 'flex',
        }}
      >
        <CreateDirButton reFetch={refetch} fatherPath={'/'} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
