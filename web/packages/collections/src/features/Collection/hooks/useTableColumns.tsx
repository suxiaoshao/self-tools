import { Chip } from '@mui/material';
import { CollectionAndItemsQuery } from '../../../graphql';
import { useMemo } from 'react';
import { CustomColumnDefArray } from 'custom-table';
import { format } from 'time';
import Name from '../components/Name';
import Actions from '../components/Actions';
import { Article, Folder } from '@mui/icons-material';
import { useI18n } from 'i18n';
import { match, P } from 'ts-pattern';

const Typename = ({ __typename }: { __typename: CollectionAndItem['__typename'] }) => {
  const t = useI18n();
  return match(__typename)
    .with('Collection', () => <Chip icon={<Folder />} variant="outlined" label={t('collection')} color="primary" />)
    .with('Item', () => <Chip icon={<Article />} variant="outlined" label={t('item')} color="secondary" />)
    .exhaustive();
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
        accessorFn: (data) =>
          match(data)
            .with({ __typename: 'Collection' }, (data) => data.path)
            .with({ __typename: 'Item' }, () => '-')
            .exhaustive(),
        cell: (context) => context.getValue(),
      },
      {
        header: t('description'),
        id: 'description',
        accessorFn: (data) =>
          match(data)
            .with({ __typename: 'Collection', description: P.nonNullable }, ({ description }) => description ?? '-')
            .otherwise(() => '-'),
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
