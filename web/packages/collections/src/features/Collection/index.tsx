/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 13:27:19
 * @FilePath: /self-tools/web/packages/collections/src/features/Collection/index.tsx
 */
import { CustomTable, getCoreRowModel, useCustomTable, usePage, usePageWithTotal } from 'custom-table';
import { RefreshCcw } from 'lucide-react';
import CreateCollectionButton from './components/CreateCollectionButton';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './hooks/useParentId';
import useTableColumns from './hooks/useTableColumns';
import CreateItemButton from './components/CreateItemButton';
import { useCallback, useEffect, useMemo } from 'react';
import { useI18n } from 'i18n';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@collections/gql';
import { useQuery } from '@apollo/client/react';
import { useAllCollection } from './collectionSlice';
import { Button } from '@portal/components/ui/button';

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
    // oxlint-disable-next-line exhaustive-deps
  }, [id]);
  const { data: sourceData, refetch } = useQuery(CollectionAndItems, {
    variables: { query: { id, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } } },
  });
  const { fetchData } = useAllCollection();
  const allRefetch = useCallback(async () => {
    await Promise.all([refetch(), fetchData()]);
  }, [refetch, fetchData]);
  const { data, total } = sourceData?.collectionAndItem ?? {};
  const page = usePageWithTotal(pageState, total);
  const columns = useTableColumns(allRefetch);
  const tableInstance = useCustomTable(
    useMemo(
      () => ({
        columns,
        data: data ?? [],
        getCoreRowModel: getCoreRowModel(),
      }),
      [columns, data],
    ),
  );

  return (
    <div className="size-full p-4 flex flex-col">
      <AncestorsPath />
      <div className="flex-[0_0_auto] mb-2 flex">
        <CreateCollectionButton refetch={allRefetch} />
        {id && <CreateItemButton className="ml-2" refetch={allRefetch} collectionIds={[id]} />}
        <Button variant="ghost" className="ml-auto rounded-full" size="icon" onClick={() => refetch()}>
          <RefreshCcw />
        </Button>
      </div>
      <CustomTable tableInstance={tableInstance} page={page} />
    </div>
  );
}
