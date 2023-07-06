import { Chip } from '@mui/material';
import { CollectionAndItemsQuery } from '../../../graphql';
import { useMemo } from 'react';
import { CustomColumnDefArray } from 'custom-table';
import { format } from 'time';
import Name from '../components/Name';
import Actions from '../components/Actions';
import { Article, Folder } from '@mui/icons-material';
import { useI18n } from 'i18n';

const Typename = ({ __typename }: { __typename: CollectionAndItem['__typename'] }) => {
  const t = useI18n();
  return __typename === 'Collection' ? (
    <Chip icon={<Folder />} variant="outlined" label={t('collection')} color="primary" />
  ) : (
    <Chip icon={<Article />} variant="outlined" label={t('item')} color="secondary" />
  );
};

export type CollectionAndItem = CollectionAndItemsQuery['collectionAndItem']['data'][0];

export default function useTableColumns(refetch: () => void) {
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<CollectionAndItemsQuery['collectionAndItem']['data'][0]>>(
    () => [
      {
        header: t('type'),
        id: '__typename',
        accessorFn: ({ __typename }) => <Typename __typename={__typename} />,
        cell: (context) => context.getValue(),
      },
      {
        header: t('name'),
        id: 'name',
        accessorFn: (item) => <Name {...item} />,
        cell: (context) => context.getValue(),
      },
      {
        header: t('name'),
        id: 'path',
        accessorFn: (data) => (data.__typename === 'Collection' ? data.path : '-'),
        cell: (context) => context.getValue(),
      },
      {
        header: t('description'),
        id: 'description',
        accessorFn: (data) => (data.__typename === 'Collection' ? data.description ?? '-' : '-'),
        cellProps: {
          align: 'center',
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
        accessorFn: (item) => <Actions {...item} refetch={refetch} />,
        cellProps: { padding: 'none' },
        cell: (context) => context.getValue(),
      },
    ],
    [refetch, t],
  );
  return columns;
}
