import { PageToolbar } from 'ui/page-toolbar';
import { RequestNotice } from 'custom-graphql';
import { CustomTable, getCoreRowModel, usePage, usePageWithTotal } from 'custom-table';
import { RefreshCcw } from 'lucide-react';
import { CreateCollectionButton } from '@collections/features/collection';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './hooks/useParentId';
import useTableColumns from './hooks/useTableColumns';
import { CreateItemButton } from '@collections/features/item';
import { useCallback, useEffect, useMemo } from 'react';
import { useI18n } from 'i18n';
import { useTitle } from 'hooks';
import { graphql } from '@collections/gql/index';
import { useQuery } from '@apollo/client/react';
import { useAllCollection } from '../../entities/collection';
import { Button } from 'ui/components/button';

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
    pageState.setPage(1);
    // oxlint-disable-next-line exhaustive-deps
  }, [id]);
  const {
    data: sourceData,
    refetch,
    error,
  } = useQuery(CollectionAndItems, {
    variables: { query: { id, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } } },
  });
  const { fetchData } = useAllCollection();
  const allRefetch = useCallback(async () => {
    await Promise.all([refetch(), fetchData()]);
  }, [refetch, fetchData]);
  const { data, total } = sourceData?.collectionAndItem ?? {};
  const page = usePageWithTotal(pageState, total);
  const columns = useTableColumns(allRefetch);
  const tableOptions = useMemo(
    () => ({
      columns,
      data: data ?? [],
      getCoreRowModel: getCoreRowModel(),
    }),
    [columns, data],
  );

  return (
    <div className="flex min-h-0 size-full flex-col">
      <PageToolbar>
        <CreateCollectionButton parentId={id} refetch={allRefetch} />
        {id && <CreateItemButton className="ml-2" refetch={allRefetch} collectionIds={[id]} />}
        <Button
          variant="ghost"
          className="ml-auto rounded-full"
          size="icon"
          onClick={() => refetch()}
          aria-label={t('refresh')}
        >
          <RefreshCcw />
        </Button>
      </PageToolbar>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <AncestorsPath />

        <RequestNotice error={error} retry={allRefetch} />
        <CustomTable options={tableOptions} page={page} />
      </div>
    </div>
  );
}
