import { RefreshCcw } from 'lucide-react';
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
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'time';
import CreateNovelButton from './Components/CreateNovelButton';
import { convertFormToVariables } from './utils';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import CollectionMultiSelect from '@bookmarks/components/CollectionMultiSelect';
import TagsSelect from '@bookmarks/components/TagsSelect';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@bookmarks/gql';
import { useMutation, useQuery } from '@apollo/client/react';
import type { GetNovelsQuery, GetNovelsQueryVariables } from '@bookmarks/gql/graphql';
import { Button } from '@portal/components/ui/button';
import { Card, CardContent } from '@portal/components/ui/card';
import { Switch } from '@portal/components/ui/switch';
import { FieldLabel, Field } from '@portal/components/ui/field';
import { Avatar, AvatarImage } from '@portal/components/ui/avatar';

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
        description
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
      id
    }
  }
`);

type Data = GetNovelsQuery['queryNovels']['data'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function NovelList() {
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
  const { data: { queryNovels: { data, total } = {} } = {}, refetch } = useQuery(GetNovels, {
    variables: convertFormToVariables(form, pageState),
  });
  const page = usePageWithTotal(pageState, total);

  const [deleteNovel] = useMutation(DeleteNovel);
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
        columnHelper.accessor(
          ({ id, name }) => (
            <Button variant="link" className="text-foreground w-fit px-0 text-left" asChild>
              <Link to={`/bookmarks/novel/${id}`}>{name}</Link>
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
        columnHelper.accessor(({ novelStatus }) => t(getLabelKeyByNovelStatus(novelStatus)), {
          header: t('novel_status'),
          id: 'status',
          cell: (context) => context.getValue(),
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
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {() => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteNovel({ variables: { id } });
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
    [deleteNovel, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col size-full">
      <div className="basis-auto flex p-4 pb-0 gap-4">
        <CreateNovelButton refetch={refetch} />
        <Button color="primary" onClick={() => navigate('/bookmarks/novel/fetch')}>
          {t('crawler')}
        </Button>
        <div className="grow" />
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
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
                  <Switch checked={value} onCheckedChange={onChange} {...field} />
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
                  <Switch checked={value} onCheckedChange={onChange} {...field} />
                )}
              />
            </Field>

            <Field className="*:w-auto">
              <FieldLabel>{t('match_tags')}</FieldLabel>
              <Controller
                control={control}
                name="tagMatch.matchSet"
                render={({ field }) => <TagsSelect className="w-[400px]" {...field} />}
              />
            </Field>
          </CardContent>
        </Card>
        <CustomTable className="w-full" tableInstance={tableInstance} page={page} />
      </div>
    </div>
  );
}
