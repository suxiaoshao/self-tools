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
import { Box, FormControl, FormLabel, IconButton, Link, Paper, Switch } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useMemo } from 'react';
import { DeleteItem } from '@collections/features/Collection/components/Actions';
import { convertFormToVariables } from './utils';
import CollectionMultiSelect from '@collections/components/CollectionMultiSelect';
import { format } from 'time';
import CreateItemButton from '@collections/features/Collection/components/CreateItemButton';

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
  const { control, watch, register } = useForm<FormData>({
    defaultValues: {
      collectionMatch: { matchSet: [] },
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
            <Link to={`/collections/item/${id}`} underline="hover" component={RouterLink}>
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
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {(onClose) => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteItem({ variables: { id } });
                    onClose();
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
  const tableInstance = useCustomTable({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() });
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box
        sx={{
          flex: '0 0 auto',
          display: 'flex',
          p: 2,
          pb: 0,
        }}
      >
        <CreateItemButton refetch={refetch} collectionIds={[]} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <Box sx={{ flex: '1 1 0', overflowY: 'auto', p: 2, pr: 1 }}>
        <Paper
          sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', p: 1, marginBottom: 2, rowGap: 1, columnGap: 2 }}
        >
          <FormControl>
            <FormLabel id="collection-full-match">{t('collection_whether_full_match')}</FormLabel>
            <Switch aria-labelledby="collection-full-match" {...register('collectionMatch.fullMatch')} />
          </FormControl>

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">{t('match_collections')} </FormLabel>
            <Controller
              control={control}
              name="collectionMatch.matchSet"
              render={({ field }) => <CollectionMultiSelect {...field} />}
            />
          </FormControl>
        </Paper>
        <CustomTable
          sx={{
            overflowY: 'hidden',
            flex: undefined,
            maxHeight: undefined,
          }}
          tableInstance={tableInstance}
          page={page}
        />
      </Box>
    </Box>
  );
}
