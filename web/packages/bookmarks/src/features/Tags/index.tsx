import { Box, IconButton } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import CollectionSelect from '../../components/CollectionSelect';
import { CreateTagMutationVariables, GetTagsQuery, useDeleteTagMutation, useGetTagsLazyQuery } from '../../graphql';
import { Refresh } from '@mui/icons-material';
import { useCallback, useMemo } from 'react';
import { CustomColumnArray, CustomTable, getCoreRowModel, TableActions, useCustomTable } from 'custom-table';
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';
import { useI18n } from 'i18n';

export default function Tags() {
  type FormData = CreateTagMutationVariables;
  const { control, handleSubmit } = useForm<FormData>();
  const [getTags, { data, refetch }] = useGetTagsLazyQuery();
  const [deleteTag] = useDeleteTagMutation();
  const onSearch = useCallback(
    ({ collectionId }: FormData) => {
      getTags({ variables: { collectionId } });
    },
    [getTags],
  );
  const t = useI18n();
  const columns = useMemo<CustomColumnArray<GetTagsQuery['queryTags'][0]>>(
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
  const tableInstance = useCustomTable({ columns, data: data?.queryTags ?? [], getCoreRowModel: getCoreRowModel() });

  return useMemo(
    () => (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
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
          {/* <CreateTagButton refetch={refetch} collectionId={collectionId} /> */}
          <IconButton sx={{ marginLeft: 'auto' }} onClick={handleSubmit(onSearch)}>
            <Refresh />
          </IconButton>
        </Box>
        <CustomTable tableInstance={tableInstance} />
      </Box>
    ),
    [control, handleSubmit, onSearch, tableInstance],
  );
}
