import { PageToolbar } from 'ui/page-toolbar';
import { RequestNotice } from 'custom-graphql';
import { useTitle } from 'hooks';
import { graphql } from '@collections/gql/index';
import type { GetItemsQuery, GetItemsQueryVariables } from '@collections/gql/graphql';
import { useI18n } from 'i18n';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  getCoreRowModel,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { useMemo } from 'react';
import ItemActions from '../components/ItemActions';
import { convertFormToVariables } from './utils';
import { CollectionMultiSelect } from '@collections/entities/collection';
import { format } from 'time';
import CreateItemButton from '@collections/features/item/components/CreateItemButton';
import { Button, buttonVariants } from 'ui/components/button';
import { RefreshCcw } from 'lucide-react';
import { Card, CardContent } from 'ui/components/card';
import { FieldLabel, Field } from 'ui/components/field';
import { Switch } from 'ui/components/switch';

const GetItems = graphql(`
  query getItems($collectionMatch: TagMatch, $pagination: Pagination!) {
    queryItems(collectionMatch: $collectionMatch, pagination: $pagination) {
      data {
        id
        name
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
            <Link
              to={`/collections/item/${id}`}
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
        columnHelper.accessor(({ id, name }) => <ItemActions id={id} name={name} refetch={refetch} />, {
          header: t('actions'),
          id: 'action',
          cell: (context) => context.getValue(),
        }),
      ] as CustomColumnDefArray<Data>,
    [refetch, t],
  );
  const tableOptions = useMemo(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  return (
    <div className="flex min-h-0 size-full flex-col">
      <PageToolbar>
        <CreateItemButton variant="default" refetch={refetch} collectionIds={[]} />
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full ml-auto"
          onClick={() => refetch()}
          aria-label={t('refresh')}
        >
          <RefreshCcw />
        </Button>
      </PageToolbar>
      <div className="flex min-h-0 flex-1 flex-col">
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
          <CustomTable className="overflow-hidden flex-none max-h-none" options={tableOptions} page={page} />
        </div>
      </div>
    </div>
  );
}
