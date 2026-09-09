import { RequestNotice } from 'custom-graphql';
import { checkDeleted } from '@bookmarks/features/author/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { RefreshCcw } from 'lucide-react';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  TableActions,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import CreateAuthorButton from './components/CreateAuthorButton';
import { useMemo } from 'react';
import { format } from 'time';
import { useI18n } from 'i18n';
import { Link } from 'react-router';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { useTitle } from 'hooks';
import { graphql } from '@bookmarks/gql/index';
import { useMutation, useQuery } from '@apollo/client/react';
import type { GetAuthorsQuery } from '@bookmarks/gql/graphql';
import { Button } from 'ui/components/button';
import { Avatar, AvatarImage } from 'ui/components/avatar';

const GetAuthors = graphql(`
  query getAuthors($pagination: Pagination!) {
    queryAuthors(pagination: $pagination) {
      data {
        id
        site
        name
        createTime
        updateTime
        avatar
        description
      }
      total
    }
  }
`);

const DeleteAuthor = graphql(`
  mutation deleteAuthor($id: Int!) {
    deleteAuthor(id: $id) {
      __typename
      ... on ResourceDeleted {
        resource {
          kind
          id
        }
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
    }
  }
`);

type TableItem = GetAuthorsQuery['queryAuthors']['data'][0];

const columnHelper = createCustomColumnHelper<TableItem>();
export default function AuthorList() {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks/authors');
  // fetch
  const pageState = usePage();
  const {
    data: queryData,
    refetch,
    error,
  } = useQuery(GetAuthors, {
    variables: { pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } },
  });
  const data = queryData?.queryAuthors?.data;
  const total = queryData?.queryAuthors?.total;
  const page = usePageWithTotal(pageState, total);

  const [deleteAuthor] = useMutation(DeleteAuthor);
  const t = useI18n();
  useTitle(t('author_manage'));
  const columns = useMemo<CustomColumnDefArray<TableItem>>(
    () =>
      [
        columnHelper.accessor(
          ({ name, id }) => (
            <Button variant="link" className="text-foreground w-fit px-0 text-left">
              <Link to={`/bookmarks/authors/${id}`}>{name}</Link>
            </Button>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
            meta: {},
          },
        ),
        columnHelper.accessor(({ site }) => t(getLabelKeyBySite(site)), {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ avatar }) => (
            <Avatar>
              <AvatarImage src={getImageUrl(avatar)} />
            </Avatar>
          ),
          {
            header: t('avatar'),
            id: 'avatar',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(({ description }) => <p className="truncate">{description}</p>, {
          header: t('description'),
          id: 'description',
          cellProps: {
            className: 'max-w-[200px]',
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
          cellProps: {
            className: 'max-w-[150px]',
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
          cellProps: {
            className: 'max-w-[150px]',
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {() => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    if (
                      !(await write.execute(
                        async () => (await deleteAuthor({ variables: { id } })).data?.deleteAuthor,
                        { verify: () => checkDeleted(client, id), confirmed: refetch },
                      ))
                    )
                      return;
                    void Promise.resolve()
                      .then(() => refetch())
                      .catch(() => undefined);
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
      ] as CustomColumnDefArray<TableItem>,
    [deleteAuthor, refetch, t, write, client],
  );
  const tableOptions = useMemo<CustomTableOptions<TableItem>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );

  return (
    <div className="flex flex-col size-full p-4">
      <RequestNotice error={error} />
      {write.notice}
      <div className="flex-[0_0_auto] mb-4 flex">
        <CreateAuthorButton refetch={refetch} />
        <Button className="ml-2">
          <Link to="/bookmarks/authors/fetch">{t('crawler')}</Link>
        </Button>
        <Button className="ml-auto" variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCcw />
        </Button>
      </div>
      <CustomTable options={tableOptions} page={page} />
    </div>
  );
}
