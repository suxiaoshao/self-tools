import { Box, IconButton } from '@mui/material';
import { Controller, useForm, useWatch } from 'react-hook-form';
import CollectionSelect from '../../components/CollectionSelect';
import { CreateTagMutationVariables, GetTagsQuery, useDeleteTagMutation, useGetTagsLazyQuery } from '../../graphql';
import { Search } from '@mui/icons-material';
import { useCallback, useMemo } from 'react';
import {
  CustomColumnArray,
  CustomTable,
  CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';
import { useI18n } from 'i18n';

const rowModel = getCoreRowModel();

type Data = GetTagsQuery['queryTags'][0];

export default function Tags() {
  type FormData = CreateTagMutationVariables;
  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormData>();
  const [getTags, { data, refetch }] = useGetTagsLazyQuery();
  const [deleteTag] = useDeleteTagMutation();
  const onSearch = useCallback(
    ({ collectionId }: FormData) => {
      getTags({ variables: { collectionId } });
    },
    [getTags],
  );
  const collectionId = useWatch({ control, name: 'collectionId' });
  const t = useI18n();
  const columns = useMemo<CustomColumnArray<Data>>(
    () => [
      {
        header: t('name'),
        id: 'name',
        accessorKey: 'name',
      },
      {
        header: t('create_time'),
        id: 'createTime',
        accessorFn: ({ createTime }) => format(createTime),
        cell: (context) => context.getValue(),
      },
      {
        header: t('update_time'),
        id: 'updateTime',
        accessorFn: ({ updateTime }) => format(updateTime),
        cell: (context) => context.getValue(),
      },
      {
        header: t('actions'),
        id: 'action',
        accessorFn: ({ id }) => (
          <TableActions>
            {(onClose) => [
              {
                text: t('delete'),
                onClick: async () => {
                  await deleteTag({ variables: { id } });
                  onClose();
                  await refetch();
                },
              },
            ]}
          </TableActions>
        ),
        cellProps: { padding: 'none' },
        cell: (context) => context.getValue(),
      },
    ],
    [deleteTag, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data?.queryTags ?? [], getCoreRowModel: rowModel }),
    [columns, data?.queryTags],
  );
  const tableInstance = useCustomTable(tableOptions);

  const input = useMemo(() => {
    return (
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <Controller
          rules={{ required: true }}
          control={control}
          name="collectionId"
          render={({ field }) => <CollectionSelect {...field} />}
        />
        {/* todo */}
        <CreateTagButton refetch={refetch} collectionId={collectionId} />
        <IconButton disabled={!isValid} sx={{ marginLeft: 'auto' }} onClick={handleSubmit(onSearch)}>
          <Search />
        </IconButton>
      </Box>
    );
  }, [collectionId, control, handleSubmit, isValid, onSearch, refetch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      {input}
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
