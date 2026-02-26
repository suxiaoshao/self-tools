import { RefreshCcw } from 'lucide-react';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  useCustomTable,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { useCallback, useEffect, useEffectEvent, useMemo } from 'react';
import { useAllCollection } from './collectionSlice';
import AncestorsPath from './components/AncestorsPath';
import CreateCollectionButton from './components/CreateCollectionButton';
import useParentId from './components/useParentId';
import type { CollectionTableData } from './types';
import { useI18n } from 'i18n';
import { Link, createSearchParams } from 'react-router-dom';
import { format } from 'time';
import CollectionActions from './components/CollectionActions';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@bookmarks/gql';
import { useQuery } from '@apollo/client/react';
import { Button } from '@portal/components/ui/button';

const GetCollections = graphql(`
  query getCollections($parentId: Int, $pagination: Pagination!) {
    getCollections(parentId: $parentId, pagination: $pagination) {
      data {
        name
        id
        path
        createTime
        updateTime
        description
      }
      total
    }
  }
`);

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
  const { data: { getCollections: { data, total } = {} } = {}, refetch } = useQuery(GetCollections, {
    variables: { parentId, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } },
  });
  const page = usePageWithTotal(pageState, total);
  const { fetchData } = useAllCollection();

  const allRefetch = useCallback(async () => {
    await Promise.all([refetch(), fetchData()]);
  }, [refetch, fetchData]);

  const t = useI18n();
  useTitle(t('collection_manage'));
  const columns = useMemo<CustomColumnDefArray<CollectionTableData>>(
    () =>
      [
        columnHelper.accessor(
          ({ name, id }) => (
            <Button variant="link" className="text-foreground w-fit px-0 text-left">
              <Link to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>{name}</Link>
            </Button>
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
          cellProps: {
            align: 'center',
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
        columnHelper.accessor((data) => <CollectionActions {...data} refetch={allRefetch} />, {
          header: t('actions'),
          id: 'action',
          cell: (context) => context.getValue(),
        }),
      ] as CustomColumnDefArray<CollectionTableData>,
    [allRefetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<CollectionTableData>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);

  return (
    <div className="size-full p-4 flex flex-col">
      <AncestorsPath />
      <div className="flex flex-[0_0_auto] mb-4">
        <CreateCollectionButton refetch={refetch} />
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => refetch()}>
          <RefreshCcw />
        </Button>
      </div>
      <CustomTable tableInstance={tableInstance} page={page} />
    </div>
  );
}
