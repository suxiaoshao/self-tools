import { RequestNotice } from 'custom-graphql';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@collections/gql';
import type { GetItemsQuery, GetItemsQueryVariables } from '@collections/gql/graphql';
import { useI18n } from 'i18n';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  getCoreRowModel,
  useCustomTable,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { useMemo } from 'react';
import { DeleteItemAction } from '@collections/features/Collection/components/Actions';
import { convertFormToVariables } from './utils';
import CollectionMultiSelect from '@collections/components/CollectionMultiSelect';
import { format } from 'time';
import CreateItemButton from '@collections/features/Collection/components/CreateItemButton';
import { Button } from '@portal/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@portal/components/ui/card';
import { FieldLabel, Field } from '@portal/components/ui/field';
import { Switch } from '@portal/components/ui/switch';

const GetItems = graphql(`
  query getItems($collectionMatch: TagMatch, $pagination: Pagination!) {
    queryItems(collectionMatch: $collectionMatch, pagination: $pagination) {
      data {
        id
        name
        content
        createTime
        updateTime
      }
      total
    }
  }
`);

type Data = GetItemsQuery['queryItems']['data'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function ItemList() {
  // i18n
  const t = useI18n();
  // title
  useTitle(t('item_manage'));
  // form & table
  type FormData = Omit<GetItemsQueryVariables, 'pagination'>;
  const pageState = usePage();
  const { control, watch } = useForm<FormData>({
    defaultValues: {
      collectionMatch: { matchSet: [], fullMatch: false },
    },
  });
  const form = watch();
  const {
    data: { queryItems: { data, total } = {} } = {},
    refetch,
    error,
  } = useQuery(GetItems, {
    variables: convertFormToVariables(form, pageState),
  });
  const page = usePageWithTotal(pageState, total);
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
        columnHelper.accessor(
          ({ id, name }) => (
            <Button variant="link" className="text-foreground w-fit px-0 text-left">
              <Link to={`/collections/item/${id}`}>{name}</Link>
            </Button>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
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
        columnHelper.accessor(({ id }) => <DeleteItemAction id={id} refetch={refetch} />, {
          header: t('actions'),
          id: 'action',
          cell: (context) => context.getValue(),
        }),
      ] as CustomColumnDefArray<Data>,
    [refetch, t],
  );
  const tableInstance = useCustomTable(
    useMemo(() => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }), [columns, data]),
  );
  return (
    <div className="flex flex-col size-full">
      <div className="flex-[0_0_auto] flex p-4 pb-0">
        <CreateItemButton variant="default" refetch={refetch} collectionIds={[]} />
        <Button variant="ghost" size="icon-lg" className="rounded-full ml-auto" onClick={() => refetch()}>
          <RefreshCcw />
        </Button>
      </div>
      <div className="flex-[1_1_0] overflow-auto p-4 pr-2">
        <Card className="mb-4 gap-0">
          <CardContent className="grid grid-cols-[auto_1fr] gap-y-2 gap-x-4">
            <Field>
              <FieldLabel id="collection-full-match">{t('collection_whether_full_match')}</FieldLabel>
              <Controller
                control={control}
                name="collectionMatch.fullMatch"
                render={({ field: { onChange, value, ...field } }) => (
                  <Switch {...field} checked={value} onCheckedChange={onChange} />
                )}
              />
            </Field>

            <Field>
              <FieldLabel>{t('match_collections')}</FieldLabel>
              <Controller
                control={control}
                name="collectionMatch.matchSet"
                render={({ field }) => <CollectionMultiSelect {...field} />}
              />
            </Field>
          </CardContent>
        </Card>
        <RequestNotice error={error} retry={refetch} />
        <CustomTable className="overflow-hidden flex-none max-h-none" tableInstance={tableInstance} page={page} />
      </div>
    </div>
  );
}
