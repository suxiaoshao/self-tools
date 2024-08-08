import { Box, IconButton, Link } from '@mui/material';
import { GetTagsQuery, useDeleteTagMutation, useGetTagsLazyQuery } from '../../graphql';
import { Search } from '@mui/icons-material';
import { useCallback, useEffect, useMemo } from 'react';
import {
  CustomColumnDefArray,
  CustomTable,
  CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';
import { useI18n } from 'i18n';
import { getLabelKeyBySite } from '@bookmarks/utils/novel_site';

const rowModel = getCoreRowModel();

type Data = GetTagsQuery['queryTags'][0];

export default function Tags() {
  const [getTags, { data, refetch }] = useGetTagsLazyQuery();
  const [deleteTag] = useDeleteTagMutation();
  const onSearch = useCallback(() => {
    getTags();
  }, [getTags]);
  useEffect(() => {
    onSearch();
  }, [onSearch]);
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () => [
      {
        header: t('name'),
        id: 'name',
        accessorFn: ({ url, name }) => (
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
        cell: (context) => context.getValue(),
      },
      {
        header: t('novel_site'),
        id: 'site',
        accessorFn: ({ site }) => t(getLabelKeyBySite(site)),
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
                  await deleteTag({ variables: { id } });
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
    [deleteTag, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data?.queryTags ?? [], getCoreRowModel: rowModel }),
    [columns, data?.queryTags],
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
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
