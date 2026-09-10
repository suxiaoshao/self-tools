import { PageToolbar } from 'ui/page-toolbar';
import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
import { RequestNotice } from 'custom-graphql';
import { checkDeleted } from '@bookmarks/features/tags/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
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
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';
import { useI18n } from 'i18n';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { useTitle } from 'hooks';
import { graphql } from '@bookmarks/gql/index';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import type { GetTagsQuery } from '@bookmarks/gql/graphql';
import { Button, buttonVariants } from 'ui/components/button';

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

const rowModel = getCoreRowModel();

type Data = GetTagsQuery['queryTags']['data'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function Tags() {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks/tags');
  const [target, setTarget] = useState<{ id: number; name: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pageState = usePage();
  const [getTags, { data: queryData, refetch, error }] = useLazyQuery(GetTags);
  const data = queryData?.queryTags?.data;
  const total = queryData?.queryTags?.total;
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
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'link', className: 'w-fit px-0 text-left' })}
            >
              {name}
            </a>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor('site', {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => t(getLabelKeyBySite(context.getValue())),
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
        columnHelper.display({
          header: t('actions'),
          id: 'action',
          cell: ({
            row: {
              original: { id, name },
            },
          }) => (
            <TableActions triggerId={`tag-actions-${id}`}>
              {() => [
                {
                  text: t('delete'),
                  disabled: write.pending || (write.blocked && target?.id !== id),
                  onClick: () => {
                    if (!write.blocked) setTarget({ id, name });
                    setConfirmOpen(true);
                  },
                },
              ]}
            </TableActions>
          ),
        }),
      ] as CustomColumnDefArray<Data>,
    [t, write, target],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: rowModel }),
    [columns, data],
  );

  const toolbar = useMemo(() => {
    return (
      <PageToolbar>
        <CreateTagButton refetch={refetch} />
        <Button variant="ghost" size="icon" className="ml-auto" onClick={onSearch} aria-label={t('search')}>
          <Search />
        </Button>
      </PageToolbar>
    );
  }, [onSearch, refetch, t]);

  return (
    <div className="flex min-h-0 size-full flex-col">
      {toolbar}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <RequestNotice error={error} />
        {!confirmOpen && write.notice}
        <ConfirmationDialog
          returnFocus={() => document.getElementById(`tag-actions-${target?.id}`)}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('delete_target', { name: target?.name })}
          description={t('delete_tag_impact')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          pending={write.pending}
          confirmDisabled={write.blocked}
          notice={write.notice}
          onConfirm={async () => {
            if (!target) return;
            const { id } = target;
            const confirmed = () => {
              setConfirmOpen(false);
              void Promise.resolve()
                .then(() => refetch())
                .catch(() => undefined);
            };
            if (
              await write.execute(async () => (await deleteTag({ variables: { id } })).data?.deleteTag, {
                verify: () => checkDeleted(client, id),
                confirmed,
              })
            )
              confirmed();
          }}
        />
        <CustomTable options={tableOptions} page={page} />
      </div>
    </div>
  );
}
