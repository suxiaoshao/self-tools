import { Box, IconButton, Link } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import CollectionSelect from '../../components/CollectionSelect';
import { CreateTagMutationVariables, GetTagsQuery, useGetTagsQuery } from '../../graphql';
import { Refresh } from '@mui/icons-material';
import { useMemo } from 'react';
import { CustomColumnArray, CustomTable, TableActions, useCustomTable } from 'custom-table';
import { format } from 'time';
import CreateTagButton from './components/CreateTagButton';

type FormData = CreateTagMutationVariables;
export default function Tags() {
  const { control, watch } = useForm<FormData>();
  const collectionId = watch('collectionId');
  const { data: { getTagList } = {}, refetch } = useGetTagsQuery({ variables: { collectionId } });
  const columns = useMemo<CustomColumnArray<GetTagsQuery['getTagList'][0]>>(
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
                  // await deleteCollection({ variables: { id } });
                  // todo
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
    [refetch],
  );
  const tableInstance = useCustomTable({ columns, data: getTagList ?? [] });

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
