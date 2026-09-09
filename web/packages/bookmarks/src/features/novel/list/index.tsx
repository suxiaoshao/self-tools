import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
import { RequestNotice } from 'custom-graphql';
import { checkDeleted } from '@bookmarks/features/novel/model/reconcile';
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
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { format } from 'time';
import CreateNovelButton from './components/CreateNovelButton';
import { convertFormToVariables } from './utils';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { CollectionMultiSelect } from '@bookmarks/entities/collection';
import TagsSelect from '@bookmarks/components/TagsSelect/index';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import { useTitle } from 'hooks';
import { graphql } from '@bookmarks/gql/index';
import { useMutation, useQuery } from '@apollo/client/react';
import type { GetNovelsQuery, GetNovelsQueryVariables } from '@bookmarks/gql/graphql';
import { Button, buttonVariants } from 'ui/components/button';
import { Card, CardContent } from 'ui/components/card';
import { Switch } from 'ui/components/switch';
import { FieldLabel, Field } from 'ui/components/field';
import { Avatar, AvatarFallback, AvatarImage } from 'ui/components/avatar';

const GetNovels = graphql(`
  query getNovels(
    $collectionMatch: TagMatch
    $novelStatus: NovelStatus
    $tagMatch: TagMatch
    $pagination: Pagination!
  ) {
    queryNovels(
      collectionMatch: $collectionMatch
      novelStatus: $novelStatus
      tagMatch: $tagMatch
      pagination: $pagination
    ) {
      data {
        id
        name
        description
        createTime
        updateTime
        novelStatus
        avatar
        site
      }
      total
    }
  }
`);

const DeleteNovel = graphql(`
  mutation deleteNovel($id: Int!) {
    deleteNovel(id: $id) {
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

type Data = GetNovelsQuery['queryNovels']['data'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function NovelList() {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks');
  const [target, setTarget] = useState<{ id: number; name: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // i18n
  const t = useI18n();
  // title
  useTitle(t('novel_manage'));
  // form & table
  type FormData = Omit<GetNovelsQueryVariables, 'pagination'>;
  const pageState = usePage();
  const { control, watch } = useForm<FormData>({
    defaultValues: {
      tagMatch: { matchSet: [], fullMatch: false },
      collectionMatch: { matchSet: [], fullMatch: false },
    },
  });
  const form = watch();
  const {
    data: queryData,
    refetch,
    error,
  } = useQuery(GetNovels, {
    variables: convertFormToVariables(form, pageState),
  });
  const data = queryData?.queryNovels?.data;
  const total = queryData?.queryNovels?.total;
  const page = usePageWithTotal(pageState, total);

  const [deleteNovel] = useMutation(DeleteNovel);
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
        columnHelper.accessor(
          ({ id, name }) => (
            <Link
              to={`/bookmarks/novel/${id}`}
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
        columnHelper.accessor('novelStatus', {
          header: t('novel_status'),
          id: 'status',
          cell: (context) => t(getLabelKeyByNovelStatus(context.getValue())),
        }),
        columnHelper.accessor(({ description }) => description ?? '-', {
          header: t('description'),
          id: 'description',
          cellProps: {
            align: 'center',
            className: 'max-w-[200px] truncate',
          },
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
        columnHelper.display({
          header: t('actions'),
          id: 'action',
          cell: ({
            row: {
              original: { id, name },
            },
          }) => (
            <TableActions triggerId={`novel-actions-${id}`}>
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
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );

  return (
    <div className="flex flex-col size-full">
      <RequestNotice error={error} />
      {!confirmOpen && write.notice}
      <ConfirmationDialog
        returnFocus={() => document.getElementById(`novel-actions-${target?.id}`)}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('delete_target', { name: target?.name })}
        description={t('delete_novel_impact')}
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
            await write.execute(async () => (await deleteNovel({ variables: { id } })).data?.deleteNovel, {
              verify: () => checkDeleted(client, id),
              confirmed,
            })
          )
            confirmed();
        }}
      />
      <div className="basis-auto flex p-4 pb-0 gap-4">
        <CreateNovelButton refetch={refetch} />
        <Link to="/bookmarks/novel/fetch" className={buttonVariants()}>
          {t('crawler')}
        </Link>
        <div className="grow" />
        <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label={t('refresh')}>
          <RefreshCcw />
        </Button>
      </div>
      <div className="flex-[1_1_0] overflow-y-auto p-4 pr-1 w-full">
        <Card className="mb-4 gap-0">
          <CardContent className="grid grid-cols-[auto_1fr] gap-y-2 gap-x-4">
            <Field>
              <FieldLabel>{t('collection_whether_full_match')}</FieldLabel>
              <Controller
                control={control}
                name="collectionMatch.fullMatch"
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    aria-label={t('collection_whether_full_match')}
                    checked={value}
                    onCheckedChange={onChange}
                    {...field}
                  />
                )}
              />
            </Field>

            <Field className="*:w-auto">
              <FieldLabel>{t('match_collections')}</FieldLabel>
              <Controller
                control={control}
                name="collectionMatch.matchSet"
                render={({ field }) => <CollectionMultiSelect {...field} />}
              />
            </Field>

            <Field>
              <FieldLabel>{t('tag_whether_full_match')}</FieldLabel>
              <Controller
                control={control}
                name="tagMatch.fullMatch"
                render={({ field: { value, onChange, ...field } }) => (
                  <Switch
                    aria-label={t('tag_whether_full_match')}
                    checked={value}
                    onCheckedChange={onChange}
                    {...field}
                  />
                )}
              />
            </Field>

            <Field className="*:w-auto">
              <FieldLabel>{t('match_tags')}</FieldLabel>
              <Controller
                control={control}
                name="tagMatch.matchSet"
                render={({ field }) => <TagsSelect aria-label={t('match_tags')} className="w-[400px]" {...field} />}
              />
            </Field>
          </CardContent>
        </Card>
        <CustomTable className="w-full" options={tableOptions} page={page} />
      </div>
    </div>
  );
}
