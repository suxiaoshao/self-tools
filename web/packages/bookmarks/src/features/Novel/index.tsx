import { Refresh } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { CustomColumnArray, CustomTable, getCoreRowModel, TableActions, useCustomTable } from 'custom-table';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { format } from 'time';
import CollectionSelect from '../../components/CollectionSelect';
import { GetNovelsQuery, GetNovelsQueryVariables, useDeleteNovelMutation, useGetNovelsQuery } from '../../graphql';
import CreateNovelButton from './Components/CreateNovelButton';

export default function Novel() {
  type FormData = GetNovelsQueryVariables;
  const { control, watch } = useForm<FormData>({ defaultValues: {} });
  const form = watch();
  const { data: { queryNovels } = {}, refetch } = useGetNovelsQuery({ variables: form });
  const [deleteNovel] = useDeleteNovelMutation();
  const columns = useMemo<CustomColumnArray<GetNovelsQuery['queryNovels'][0]>>(
    () => [
      {
        header: '名字',
        id: 'name',
        accessorKey: 'name',
      },
      {
        header: '描述',
        id: 'description',
        accessorFn: ({ description }) => description ?? '-',
        cellProps: {
          align: 'center',
        },
        cell: (context) => context.getValue(),
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
                  await deleteNovel({ variables: { id } });
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
    [deleteNovel, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: queryNovels ?? [], getCoreRowModel: getCoreRowModel() });
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
        <CreateNovelButton collectionId={form.collectionId} refetch={refetch} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
