import { PageToolbar } from 'ui/page-toolbar';
import { RequestNotice } from 'custom-graphql';
import { RefreshCcw } from 'lucide-react';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { useCallback, useEffect, useEffectEvent, useMemo } from 'react';
import { useAllCollection } from '../../entities/collection';
import AncestorsPath from './components/AncestorsPath';
import CreateCollectionButton from './components/CreateCollectionButton';
import useParentId from './components/useParentId';
import type { CollectionTableData } from './types';
import { useI18n } from 'i18n';
import { Link, createSearchParams } from 'react-router';
import { format } from 'time';
import CollectionActions from './components/CollectionActions';
import { GetCollectionsDocument as GetCollections } from '@bookmarks/gql/graphql';
import { useQuery } from '@apollo/client/react';
import { Button, buttonVariants } from 'ui/components/button';

const columnHelper = createCustomColumnHelper<CollectionTableData>();

export default function Collections() {
  const parentId = useParentId();
  const pageState = usePage();
  const resetPage = useEffectEvent(() => {
    pageState.setPage(1);
  });
  useEffect(() => {
    resetPage();
  }, [parentId]);
  const {
    data: queryData,
    refetch,
    error,
  } = useQuery(GetCollections, {
    variables: { parentId, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } },
  });
  const data = queryData?.getCollections?.data;
  const total = queryData?.getCollections?.total;
  const page = usePageWithTotal(pageState, total);
  const { fetchData } = useAllCollection();

  const allRefetch = useCallback(async () => {
    await Promise.all([refetch(), fetchData()]);
  }, [refetch, fetchData]);

  const t = useI18n();

  const columns = useMemo<CustomColumnDefArray<CollectionTableData>>(
    () =>
      columnHelper.columns([
        columnHelper.accessor(
          ({ name, id }) => (
            <Link
              to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}
              className={buttonVariants({ variant: 'link', className: 'text-foreground w-fit px-0 text-left' })}
            >
              {name}
            </Link>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor('path', {
          header: t('path'),
          id: 'path',
        }),
        columnHelper.accessor(({ description }) => description || '-', {
          header: t('description'),
          id: 'description',
          meta: {
            cellProps: {
              align: 'center',
            },
          },
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
        }),
        columnHelper.display({
          header: t('actions'),
          id: 'action',
          cell: ({ row }) => <CollectionActions {...row.original} refetch={allRefetch} />,
        }),
      ]),
    [allRefetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<CollectionTableData>>(
    () => ({ columns, data: data ?? [] }),
    [columns, data],
  );

  return (
    <div className="flex min-h-0 size-full flex-col">
      <title>{t('collection_manage')}</title>
      <PageToolbar>
        <CreateCollectionButton refetch={allRefetch} />
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => refetch()} aria-label={t('refresh')}>
          <RefreshCcw />
        </Button>
      </PageToolbar>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <RequestNotice error={error} />
        <AncestorsPath />

        <CustomTable options={tableOptions} page={page} />
      </div>
    </div>
  );
}
