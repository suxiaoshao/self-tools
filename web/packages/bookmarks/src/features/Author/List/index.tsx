import { Avatar, Box, Button, IconButton, Link, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import {
  createCustomColumnHelper,
  CustomColumnDefArray,
  CustomTable,
  CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import { GetAuthorsQuery, useDeleteAuthorMutation, useGetAuthorsQuery } from '../../../graphql';
import CreateAuthorButton from './components/CreateAuthorButton';
import { useMemo } from 'react';
import { format } from 'time';
import { useI18n } from 'i18n';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyBySite } from '@bookmarks/utils/novel_site';

type TableItem = GetAuthorsQuery['queryAuthors'][0];

const columnHelper = createCustomColumnHelper<TableItem>();
export default function AuthorList() {
  const { data, refetch } = useGetAuthorsQuery();
  const [deleteAuthor] = useDeleteAuthorMutation();
  const t = useI18n();
  const navigate = useNavigate();
  const columns = useMemo<CustomColumnDefArray<TableItem>>(
    () =>
      [
        columnHelper.accessor(
          ({ name, id }) => (
            <Link to={`/bookmarks/authors/${id}`} component={RouterLink}>
              {name}
            </Link>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
            meta: {},
          },
        ),
        {
          header: t('novel_site'),
          id: 'site',
          accessorFn: ({ site }) => t(getLabelKeyBySite(site)),
          cell: (context) => context.getValue(),
        },
        columnHelper.accessor(({ avatar }) => <Avatar src={getImageUrl(avatar)} />, {
          header: t('avatar'),
          id: 'avatar',
          cell: (context) => context.getValue(),
        }),
        {
          header: t('description'),
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
      ] as CustomColumnDefArray<TableItem>,
    [deleteAuthor, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<TableItem>>(
    () => ({ columns, data: data?.queryAuthors ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data?.queryAuthors],
  );
  const tableInstance = useCustomTable(tableOptions);

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
        <Button
          sx={{ ml: 1 }}
          color="primary"
          size="large"
          variant="contained"
          onClick={() => navigate('/bookmarks/authors/fetch')}
        >
          {t('crawler')}
        </Button>
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
