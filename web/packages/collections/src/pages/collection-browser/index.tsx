import { PageToolbar } from 'ui/page-toolbar';
import { RequestNotice } from 'custom-graphql';
import { CustomTable, usePage, usePageWithTotal } from 'custom-table';
import { RefreshCcw } from 'lucide-react';
import { CreateCollectionButton } from '@collections/features/collection';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './hooks/useParentId';
import useTableColumns from './hooks/useTableColumns';
import { CreateItemButton } from '@collections/features/item';
import { useCallback, useEffect, useMemo } from 'react';
import { useI18n } from 'i18n';
import { CollectionAndItemsDocument as CollectionAndItems } from '@collections/gql/graphql';
import { useQuery } from '@apollo/client/react';
import { useAllCollection } from '../../entities/collection';
import { Button } from 'ui/components/button';

export default function Collection() {
  const t = useI18n();

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
    }),
    [columns, data],
  );

  return (
    <div className="flex min-h-0 size-full flex-col">
      <title>{t('collection_manage')}</title>
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
