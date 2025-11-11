import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@collections/gql';
import type { GetItemsQuery, GetItemsQueryVariables } from '@collections/gql/graphql';
import { useI18n } from 'i18n';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  getCoreRowModel,
  TableActions,
  useCustomTable,
  usePage,
  usePageWithTotal,
} from 'custom-table';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { DeleteItem } from '@collections/features/Collection/components/Actions';
import { convertFormToVariables } from './utils';
import CollectionMultiSelect from '@collections/components/CollectionMultiSelect';
import { format } from 'time';
import CreateItemButton from '@collections/features/Collection/components/CreateItemButton';
import { Button } from '@portal/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { Card, CardContent } from '@portal/components/ui/card';
import { FieldLegend, FieldSet } from '@portal/components/ui/field';
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
  const { data: { queryItems: { data, total } = {} } = {}, refetch } = useQuery(GetItems, {
    variables: convertFormToVariables(form, pageState),
  });
  const page = usePageWithTotal(pageState, total);
  const [deleteItem] = useMutation(DeleteItem);
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
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {() => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteItem({ variables: { id } });
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
    [deleteItem, refetch, t],
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
            <FieldSet>
              <FieldLegend id="collection-full-match">{t('collection_whether_full_match')}</FieldLegend>
              <Controller
                control={control}
                name="collectionMatch.fullMatch"
                render={({ field: { onChange, value, ...field } }) => (
                  <Switch {...field} checked={value} onCheckedChange={onChange} />
                )}
              />
            </FieldSet>

            <FieldSet>
              <FieldLegend>{t('match_collections')}</FieldLegend>
              <Controller
                control={control}
                name="collectionMatch.matchSet"
                render={({ field }) => <CollectionMultiSelect {...field} />}
              />
            </FieldSet>
          </CardContent>
        </Card>
        <CustomTable className="overflow-hidden flex-none max-h-none" tableInstance={tableInstance} page={page} />
      </div>
    </div>
  );
}
