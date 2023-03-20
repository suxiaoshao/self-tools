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

export default function Home() {
  const id = useParentId();
  const pageState = usePage();
  const { data: { collectionAndItem: { data, total } } = { collectionAndItem: {} }, refetch } =
    useCollectionAndItemsQuery({
      variables: { id, pagination: { page: pageState.pageIndex, pageSize: pageState.pageSize } },
    });
  const page = usePageWithTotal(pageState, total);

  const columns = useTableColumns(refetch);
  const tableInstance = useCustomTable({ columns, data: data ?? [], getCoreRowModel: getCoreRowModel() });

  return useMemo(
    () => (
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
    ),
    [id, page, refetch, tableInstance],
  );
}
