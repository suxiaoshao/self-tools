import { Avatar, Box, Button, IconButton, Link, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { type GetAuthorsQuery, useDeleteAuthorMutation, useGetAuthorsQuery } from '../../../graphql';
import CreateAuthorButton from './components/CreateAuthorButton';
import { useMemo } from 'react';
import { format } from 'time';
import { useI18n } from 'i18n';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';

type TableItem = GetAuthorsQuery['queryAuthors']['data'][0];

const columnHelper = createCustomColumnHelper<TableItem>();
export default function AuthorList() {
  // fetch
  const pageState = usePage();
  const { data: { queryAuthors: { data, total } = {} } = {}, refetch } = useGetAuthorsQuery({
    variables: { pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } },
  });
  const page = usePageWithTotal(pageState, total);

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
        columnHelper.accessor(({ site }) => t(getLabelKeyBySite(site)), {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ avatar }) => <Avatar src={getImageUrl(avatar)} />, {
          header: t('avatar'),
          id: 'avatar',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ description }) => (
            <Typography variant="body2" noWrap>
              {description}
            </Typography>
          ),
          {
            header: t('description'),
            id: 'description',
            cellProps: {
              sx: {
                maxWidth: 200,
              },
            },
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
          cellProps: {
            sx: {
              maxWidth: 150,
            },
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
          cellProps: {
            sx: {
              maxWidth: 150,
            },
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ id }) => (
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
          {
            header: t('actions'),
            id: 'action',
            cellProps: { padding: 'none' },
            cell: (context) => context.getValue(),
          },
        ),
      ] as CustomColumnDefArray<TableItem>,
    [deleteAuthor, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<TableItem>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
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
      <CustomTable tableInstance={tableInstance} page={page} />
    </Box>
  );
}
