import { Box, IconButton, Link } from '@mui/material';
import { type GetTagsQuery, useDeleteTagMutation, useGetTagsLazyQuery } from '../../graphql';
import { Search } from '@mui/icons-material';
import { useCallback, useEffect, useMemo } from 'react';
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
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';
import { useI18n } from 'i18n';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import useTitle from '@bookmarks/hooks/useTitle';

const rowModel = getCoreRowModel();

type Data = GetTagsQuery['queryTags']['data'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function Tags() {
  const pageState = usePage();
  const [getTags, { data: { queryTags: { data, total } = {} } = {}, refetch }] = useGetTagsLazyQuery({
    variables: {
      pagination: {
        page: pageState.pageIndex,
        pageSize: pageState.pageSize,
      },
    },
  });
  const page = usePageWithTotal(pageState, total);
  const [deleteTag] = useDeleteTagMutation();
  const onSearch = useCallback(() => {
    getTags();
  }, [getTags]);
  useEffect(() => {
    onSearch();
  }, [onSearch]);
  const t = useI18n();
  useTitle(t('tag_manage'));
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
        columnHelper.accessor(
          ({ url, name }) => (
            <Link
              underline="hover"
              onClick={() => {
                window.open(url, '_blank');
              }}
              sx={{ cursor: 'pointer' }}
            >
              {name}
            </Link>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(({ site }) => t(getLabelKeyBySite(site)), {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {(onClose) => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteTag({ variables: { id } });
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
            cell: (context) => context.getValue(),
          },
        ),
      ] as CustomColumnDefArray<Data>,
    [deleteTag, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: rowModel }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);

  const input = useMemo(() => {
    return (
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <CreateTagButton refetch={refetch} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={onSearch}>
          <Search />
        </IconButton>
      </Box>
    );
  }, [onSearch, refetch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      {input}
      <CustomTable tableInstance={tableInstance} page={page} />
    </Box>
  );
}
