import { Avatar, Box, IconButton, Link, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import {
  createCustomColumnHelper,
  CustomColumnArray,
  CustomTable,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import { GetAuthorsQuery, useDeleteAuthorMutation, useGetAuthorsQuery } from '../../graphql';
import CreateAuthorButton from './components/CreateAuthorButton';
import { useMemo } from 'react';
import { format } from 'time';

type TableItem = GetAuthorsQuery['queryAuthors'][0];

const columnHelper = createCustomColumnHelper<TableItem>();
export default function Author() {
  const { data: { queryAuthors } = {}, refetch } = useGetAuthorsQuery();
  const [deleteAuthor] = useDeleteAuthorMutation();
  const columns = useMemo<CustomColumnArray<TableItem>>(
    () =>
      [
        columnHelper.accessor(
          ({ url, name }) => (
            <Link target="_blank" href={url} rel="noreferrer">
              {name}
            </Link>
          ),
          {
            header: '名字',
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(({ avatar }) => <Avatar src={avatar} />, {
          header: '头像',
          id: 'avatar',
          cell: (context) => context.getValue(),
        }),
        {
          header: '描述',
          id: 'description',
          accessorFn: ({ description }) => (
            <Typography variant="body2" noWrap>
              {description}
            </Typography>
          ),
          cellProps: {
            sx: {
              maxWidth: 200,
            },
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
                    await deleteAuthor({ variables: { id } });
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
      ] as CustomColumnArray<TableItem>,
    [deleteAuthor, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: queryAuthors ?? [], getCoreRowModel: getCoreRowModel() });

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
