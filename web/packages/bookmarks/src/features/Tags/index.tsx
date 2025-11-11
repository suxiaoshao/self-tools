import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';
import { useI18n } from 'i18n';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@bookmarks/gql';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import type { GetTagsQuery } from '@bookmarks/gql/graphql';
import { Button } from '@portal/components/ui/button';

const GetTags = graphql(`
  query getTags($pagination: Pagination!) {
    queryTags(pagination: $pagination) {
      data {
        name
        id
        site
        url
        createTime
        updateTime
      }
      total
    }
  }
`);

const DeleteTag = graphql(`
  mutation deleteTag($id: Int!) {
    deleteTag(id: $id) {
      id
    }
  }
`);

const rowModel = getCoreRowModel();

type Data = GetTagsQuery['queryTags']['data'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function Tags() {
  const pageState = usePage();
  const [getTags, { data: { queryTags: { data, total } = {} } = {}, refetch }] = useLazyQuery(GetTags);
  const page = usePageWithTotal(pageState, total);
  const [deleteTag] = useMutation(DeleteTag);
  const onSearch = useCallback(() => {
    getTags({
      variables: {
        pagination: {
          page: pageState.pageIndex,
          pageSize: pageState.pageSize,
        },
      },
    });
  }, [getTags, pageState.pageIndex, pageState.pageSize]);
  useEffect(() => {
    onSearch();
  }, [onSearch]);
  const t = useI18n();
  useTitle(t('tag_manage'));
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
        columnHelper.accessor(
          ({ url, name }) => (
            <Button
              variant="link"
              className="text-foreground w-fit px-0 text-left cursor-pointer"
              onClick={() => {
                window.open(url, '_blank');
              }}
            >
              {name}
            </Button>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(({ site }) => t(getLabelKeyBySite(site)), {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => context.getValue(),
        }),
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
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {() => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteTag({ variables: { id } });
                    await refetch();
                  },
                },
              ]}
            </TableActions>
          ),
          {
            header: t('actions'),
            id: 'action',
            cell: (context) => context.getValue(),
          },
        ),
      ] as CustomColumnDefArray<Data>,
    [deleteTag, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: rowModel }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);

  const input = useMemo(() => {
    return (
      <div className="flex-0 mt-4 flex">
        <CreateTagButton refetch={refetch} />
        <Button variant="ghost" size="icon" className="ml-auto" onClick={onSearch}>
          <Search />
        </Button>
      </div>
    );
  }, [onSearch, refetch]);

  return (
    <div className="flex flex-col size-full p-4">
      {input}
      <CustomTable tableInstance={tableInstance} page={page} />
    </div>
  );
}
