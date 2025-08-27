/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 13:27:19
 * @FilePath: /self-tools/web/packages/collections/src/features/Collection/index.tsx
 */
import { Box, IconButton } from '@mui/material';
import { CustomTable, getCoreRowModel, useCustomTable, usePage, usePageWithTotal } from 'custom-table';
import { Refresh } from '@mui/icons-material';
import CreateCollectionButton from './components/CreateCollectionButton';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './hooks/useParentId';
import useTableColumns from './hooks/useTableColumns';
import CreateItemButton from './components/CreateItemButton';
import { useEffect, useMemo } from 'react';
import { useI18n } from 'i18n';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@collections/gql';
import { useQuery } from '@apollo/client/react';

const CollectionAndItems = graphql(`
  query collectionAndItems($query: CollectionItemQuery!) {
    collectionAndItem(query: $query) {
      data {
        ... on Collection {
          name
          id
          path
          createTime
          updateTime
          description
          __typename
        }
        ... on Item {
          name
          id
          updateTime
          createTime
          __typename
        }
      }
      total
    }
  }
`);

export default function Collection() {
  const t = useI18n();
  useTitle(t('collection_manage'));
  const id = useParentId();
  const pageState = usePage();
  useEffect(() => {
    // oxlint-disable-next-line react/exhaustive-deps
    pageState.setPage(1);
  }, [id]);
  const { data: sourceData, refetch } = useQuery(CollectionAndItems, {
    variables: { query: { id, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } } },
  });
  const { data, total } = sourceData?.collectionAndItem ?? {};
  const page = usePageWithTotal(pageState, total);

  const columns = useTableColumns(refetch);
  const tableOptions = useMemo(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <AncestorsPath />
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <CreateCollectionButton refetch={refetch} />
        {id && <CreateItemButton refetch={refetch} collectionId={id} />}
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} page={page} />
    </Box>
  );
}
