/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 13:27:19
 * @FilePath: /self-tools/web/packages/collections/src/features/Collection/index.tsx
 */
import { Box, IconButton } from '@mui/material';
import { useCollectionAndItemsQuery } from '../../graphql';
import { CustomTable, getCoreRowModel, useCustomTable, usePage, usePageWithTotal } from 'custom-table';
import { Refresh } from '@mui/icons-material';
import CreateCollectionButton from './components/CreateCollectionButton';
import AncestorsPath from './components/AncestorsPath';
import useParentId from './hooks/useParentId';
import useTableColumns from './hooks/useTableColumns';
import CreateItemButton from './components/CreateItemButton';
import { useMemo } from 'react';

export default function Collection() {
  const id = useParentId();
  const pageState = usePage();
  const { data: sourceData, refetch } = useCollectionAndItemsQuery({
    variables: { query: { id, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } } },
  });
  const { data, total } = sourceData?.collectionAndItem ?? {};
  const page = usePageWithTotal(pageState, total);

  const columns = useTableColumns(refetch);
  const tableOptions = useMemo(
    () => ({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data],
  );
  const tableInstance = useCustomTable(tableOptions);

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <AncestorsPath />
      <Box
        sx={{
          flex: '0 0 auto',
          marginBottom: 2,
          display: 'flex',
        }}
      >
        <CreateCollectionButton refetch={refetch} />
        {id && <CreateItemButton refetch={refetch} collectionId={id} />}
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} page={page} />
    </Box>
  );
}
