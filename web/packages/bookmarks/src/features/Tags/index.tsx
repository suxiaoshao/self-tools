import { Box, IconButton } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import CollectionSelect from '../../components/CollectionSelect';
import { CreateTagMutationVariables, GetTagsQuery, useDeleteTagMutation, useGetTagsQuery } from '../../graphql';
import { Refresh } from '@mui/icons-material';
import { useMemo } from 'react';
import { CustomColumnArray, CustomTable, getCoreRowModel, TableActions, useCustomTable } from 'custom-table';
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';

export default function Tags() {
  type FormData = CreateTagMutationVariables;
  const { control, watch } = useForm<FormData>();
  const collectionId = watch('collectionId');
  const { data: { queryTags } = {}, refetch } = useGetTagsQuery({ variables: { collectionId } });
  const [deleteTag] = useDeleteTagMutation();
  const columns = useMemo<CustomColumnArray<GetTagsQuery['queryTags'][0]>>(
    () => [
      {
        header: '名字',
        id: 'name',
        accessorKey: 'name',
      },
      {
        header: '创建时间',
        id: 'createTime',
        accessorFn: ({ createTime }) => format(createTime),
        cell: (context) => context.getValue(),
      },
      {
        header: '更新时间',
        id: 'updateTime',
        accessorFn: ({ updateTime }) => format(updateTime),
        cell: (context) => context.getValue(),
      },
      {
        header: '操作',
        id: 'action',
        accessorFn: ({ id }) => (
          <TableActions>
            {(onClose) => [
              {
                text: '删除',
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
    [deleteTag, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: queryTags ?? [], getCoreRowModel: getCoreRowModel() });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <Controller control={control} name="collectionId" render={({ field }) => <CollectionSelect {...field} />} />
        <CreateTagButton refetch={refetch} collectionId={collectionId} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
