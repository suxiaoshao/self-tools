import { Refresh } from '@mui/icons-material';
import { Box, Button, IconButton } from '@mui/material';
import { CustomColumnArray, CustomTable, TableActions, useCustomTable } from 'custom-table';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { format } from 'time';
import CollectionSelect from '../../../components/CollectionSelect';
import { GetItemsQuery, GetItemsQueryVariables, useDeleteItemMutation, useGetItemsQuery } from '../../../graphql';

export default function ItemList() {
  type FormData = GetItemsQueryVariables;
  const { control, watch } = useForm<FormData>({ defaultValues: {} });
  const form = watch();
  const { data: { queryItems } = {}, refetch } = useGetItemsQuery({ variables: form });
  const [deleteNovel] = useDeleteItemMutation();
  const columns = useMemo<CustomColumnArray<GetItemsQuery['queryItems'][0]>>(
    () => [
      {
        Header: '名字',
        id: 'name',
        accessor: 'name',
      },
      {
        Header: '创建时间',
        id: 'createTime',
        accessor: ({ createTime }) => format(createTime),
      },
      {
        Header: '更新时间',
        id: 'updateTime',
        accessor: ({ updateTime }) => format(updateTime),
      },
      {
        Header: '操作',
        id: 'action',
        accessor: ({ id }) => (
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
      },
    ],
    [deleteNovel, refetch],
  );
  const tableInstance = useCustomTable({ columns, data: queryItems ?? [] });
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
        <Button sx={{ ml: 1 }} color="primary" size="large" variant="contained">
          添加记录
        </Button>
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
