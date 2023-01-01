import { Chip } from '@mui/material';
import { CollectionAndItemsQuery } from '../../../graphql';
import { useMemo } from 'react';
import { CustomColumnArray } from 'custom-table';
import { format } from 'time';
import Name from '../components/Name';
import Actions from '../components/Actions';

const Typename = ({ __typename }: { __typename: CollectionAndItem['__typename'] }) =>
  __typename === 'Collection' ? <Chip label="集合" color="primary" /> : <Chip label="条目" color="secondary" />;

export type CollectionAndItem = CollectionAndItemsQuery['collectionAndItem']['data'][0];

export default function useTableColumns(refetch: () => void) {
  const columns = useMemo<CustomColumnArray<CollectionAndItemsQuery['collectionAndItem']['data'][0]>>(
    () => [
      {
        Header: '类型',
        id: '__typename',
        accessor: ({ __typename }) => <Typename __typename={__typename} />,
      },
      {
        Header: '名字',
        id: 'name',
        accessor: (item) => <Name {...item} />,
      },
      {
        Header: '路径',
        id: 'path',
        accessor: (data) => (data.__typename === 'Collection' ? data.path : '-'),
      },
      {
        Header: '描述',
        id: 'description',
        accessor: (data) => (data.__typename === 'Collection' ? data.description ?? '-' : '-'),
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
        accessor: (item) => <Actions {...item} refetch={refetch} />,
        cellProps: { padding: 'none' },
      },
    ],
    [refetch],
  );
  return columns;
}
