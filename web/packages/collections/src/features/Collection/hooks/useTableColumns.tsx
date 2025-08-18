import { Chip } from '@mui/material';
import type { CollectionAndItemsQuery } from '../../../graphql';
import { useMemo } from 'react';
import { createCustomColumnHelper, type CustomColumnDefArray } from 'custom-table';
import { format } from 'time';
import Name from '../components/Name';
import Actions from '../components/Actions';
import { Article, Folder } from '@mui/icons-material';
import { useI18n } from 'i18n';
import { match, P } from 'ts-pattern';
import type { CollectionAndItem } from '../types';

const Typename = ({ __typename }: { __typename: CollectionAndItem['__typename'] }) => {
  const t = useI18n();
  return match(__typename)
    .with('Collection', () => <Chip icon={<Folder />} variant="outlined" label={t('collection')} color="primary" />)
    .with('Item', () => <Chip icon={<Article />} variant="outlined" label={t('item')} color="secondary" />)
    .exhaustive();
};

const columnHelper = createCustomColumnHelper<CollectionAndItemsQuery['collectionAndItem']['data'][0]>();

export default function useTableColumns(refetch: () => void) {
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<CollectionAndItemsQuery['collectionAndItem']['data'][0]>>(
    () =>
      [
        columnHelper.accessor(({ __typename }) => <Typename __typename={__typename} />, {
          header: t('type'),
          id: '__typename',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor((item) => <Name {...item} />, {
          header: t('name'),
          id: 'name',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          (data) =>
            match(data)
              .with({ __typename: 'Collection' }, (data) => data.path)
              .with({ __typename: 'Item' }, () => '-')
              .exhaustive(),
          {
            header: t('path'),
            id: 'path',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(
          (data) =>
            match(data)
              .with({ __typename: 'Collection', description: P.nonNullable }, ({ description }) => description ?? '-')
              .otherwise(() => '-'),
          {
            header: t('description'),
            id: 'description',
            cellProps: {
              align: 'center',
            },
            cell: (context) => context.getValue(),
          },
        ),
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
        columnHelper.accessor((item) => <Actions {...item} refetch={refetch} />, {
          header: t('actions'),
          id: 'action',
          cellProps: { padding: 'none' },
          cell: (context) => context.getValue(),
        }),
      ] as CustomColumnDefArray<CollectionAndItemsQuery['collectionAndItem']['data'][0]>,
    [refetch, t],
  );
  return columns;
}
