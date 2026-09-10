import { PageToolbar } from 'ui/page-toolbar';
import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
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
import { GetAuthorsDocument as GetAuthors, DeleteAuthorDocument as DeleteAuthor } from '@bookmarks/gql/graphql';
import { useMutation, useQuery } from '@apollo/client/react';
import type { GetAuthorsQuery } from '@bookmarks/gql/graphql';
import { Button, buttonVariants } from 'ui/components/button';
import { Avatar, AvatarFallback, AvatarImage } from 'ui/components/avatar';

type TableItem = GetAuthorsQuery['queryAuthors']['data'][0];

const columnHelper = createCustomColumnHelper<TableItem>();
export default function AuthorList() {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks/authors');
  const [target, setTarget] = useState<{ id: number; name: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  const columns = useMemo<CustomColumnDefArray<TableItem>>(
    () =>
      columnHelper.columns([
        columnHelper.accessor(
          ({ name, id }) => (
            <Link
              to={`/bookmarks/authors/${id}`}
              className={buttonVariants({ variant: 'link', className: 'text-foreground w-fit px-0 text-left' })}
            >
              {name}
            </Link>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
            meta: {},
          },
        ),
        columnHelper.accessor('site', {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => t(getLabelKeyBySite(context.getValue())),
        }),
        columnHelper.accessor(
          ({ avatar, name }) => (
            <Avatar>
              <AvatarImage alt="" src={getImageUrl(avatar)} />
              <AvatarFallback aria-hidden="true">{name[0]}</AvatarFallback>
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
          meta: {
            cellProps: {
              className: 'max-w-[200px]',
            },
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
          meta: {
            cellProps: {
              className: 'max-w-[150px]',
            },
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
          meta: {
            cellProps: {
              className: 'max-w-[150px]',
            },
          },
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
            <TableActions triggerId={`author-actions-${id}`}>
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
      ]),
    [t, write, target],
  );
  const tableOptions = useMemo<CustomTableOptions<TableItem>>(() => ({ columns, data: data ?? [] }), [columns, data]);

  return (
    <div className="flex min-h-0 size-full flex-col">
      <title>{t('author_manage')}</title>
      <PageToolbar>
        <CreateAuthorButton refetch={refetch} />
        <Link to="/bookmarks/authors/fetch" className={buttonVariants({ variant: 'default', className: 'ml-2' })}>
          {t('crawler')}
        </Link>
        <Button className="ml-auto" variant="ghost" size="icon" onClick={() => refetch()} aria-label={t('refresh')}>
          <RefreshCcw />
        </Button>
      </PageToolbar>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <RequestNotice error={error} />
        {!confirmOpen && write.notice}
        <ConfirmationDialog
          returnFocus={() => document.getElementById(`author-actions-${target?.id}`)}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('delete_target', { name: target?.name })}
          description={t('delete_author_impact')}
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
              await write.execute(async () => (await deleteAuthor({ variables: { id } })).data?.deleteAuthor, {
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
