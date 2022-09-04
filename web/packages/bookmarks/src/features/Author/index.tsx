import { Avatar, Box, IconButton, Link, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { CustomColumnArray, CustomTable, TableActions, useCustomTable } from 'custom-table';
import { GetAuthorsQuery, useDeleteAuthorMutation, useGetAuthorsQuery } from '../../graphql';
import CreateAuthorButton from './components/CreateAuthorButton';
import { useMemo } from 'react';
import { format } from 'time';

export default function Author() {
  const { data: { queryAuthors } = {}, refetch } = useGetAuthorsQuery();
  const [deleteAuthor] = useDeleteAuthorMutation();
  const columns = useMemo<CustomColumnArray<GetAuthorsQuery['queryAuthors'][0]>>(
    () => [
      {
        Header: '名字',
        id: 'name',
        accessor: ({ name, url }) => (
          <Link target="_blank" href={url} rel="noreferrer">
            {name}
          </Link>
        ),
      },
      {
        Header: '头像',
        id: 'avatar',
        accessor: ({ avatar }) => <Avatar src={avatar} />,
        cellProps: { padding: 'none' },
      },
      {
        Header: '描述',
        id: 'description',
        accessor: ({ description }) => (
          <Typography variant="body2" noWrap>
            {description}
          </Typography>
        ),
        cellProps: {
          sx: {
            maxWidth: 200,
          },
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
                  await deleteAuthor({ variables: { id } });
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
    [deleteAuthor, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: queryAuthors ?? [] });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <CreateAuthorButton refetch={refetch} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
