import { Refresh } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import {
  CustomColumnDefArray,
  CustomTable,
  CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { format } from 'time';
import CollectionSelect from '../../components/CollectionSelect';
import { GetNovelsQuery, GetNovelsQueryVariables, useDeleteNovelMutation, useGetNovelsQuery } from '../../graphql';
import CreateNovelButton from './Components/CreateNovelButton';
import { convertFormToVariables } from './utils';

type Data = GetNovelsQuery['queryNovels'][0];

export default function Novel() {
  type FormData = GetNovelsQueryVariables;
  const { control, watch } = useForm<FormData>({ defaultValues: {} });
  const form = watch();
  const { data, refetch } = useGetNovelsQuery({ variables: convertFormToVariables(form) });
  const [deleteNovel] = useDeleteNovelMutation();
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () => [
      {
        header: t('name'),
        id: 'name',
        accessorKey: 'name',
      },
      {
        header: t('description'),
        id: 'description',
        accessorFn: ({ description }) => description ?? '-',
        cellProps: {
          align: 'center',
        },
        cell: (context) => context.getValue(),
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
    [deleteNovel, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data?.queryNovels ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data?.queryNovels],
  );
  const tableInstance = useCustomTable(tableOptions);
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
