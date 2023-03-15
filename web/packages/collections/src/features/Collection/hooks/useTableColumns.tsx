import { Chip } from '@mui/material';
import { CollectionAndItemsQuery } from '../../../graphql';
import { useMemo } from 'react';
import { CustomColumnArray } from 'custom-table';
import { format } from 'time';
import Name from '../components/Name';
import Actions from '../components/Actions';
import { Article, Folder } from '@mui/icons-material';

const Typename = ({ __typename }: { __typename: CollectionAndItem['__typename'] }) =>
  __typename === 'Collection' ? (
    <Chip icon={<Folder />} variant="outlined" label="集合" color="primary" />
  ) : (
    <Chip icon={<Article />} variant="outlined" label="条目" color="secondary" />
  );

export type CollectionAndItem = CollectionAndItemsQuery['collectionAndItem']['data'][0];

export default function useTableColumns(refetch: () => void) {
  const columns = useMemo<CustomColumnArray<CollectionAndItemsQuery['collectionAndItem']['data'][0]>>(
    () => [
      {
        header: '类型',
        id: '__typename',
        accessorFn: ({ __typename }) => <Typename __typename={__typename} />,
        cell: (context) => context.getValue(),
      },
      {
        header: '名字',
        id: 'name',
        accessorFn: (item) => <Name {...item} />,
        cell: (context) => context.getValue(),
      },
      {
        header: '路径',
        id: 'path',
        accessorFn: (data) => (data.__typename === 'Collection' ? data.path : '-'),
        cell: (context) => context.getValue(),
      },
      {
        header: '描述',
        id: 'description',
        accessorFn: (data) => (data.__typename === 'Collection' ? data.description ?? '-' : '-'),
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
        accessorFn: (item) => <Actions {...item} refetch={refetch} />,
        cellProps: { padding: 'none' },
        cell: (context) => context.getValue(),
      },
    ],
    [refetch],
  );
  return columns;
}
