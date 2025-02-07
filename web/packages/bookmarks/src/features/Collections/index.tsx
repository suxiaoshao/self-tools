import { Refresh } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { CustomTable } from 'custom-table';
import { useCallback } from 'react';
import { useGetCollectionsQuery } from '../../graphql';
import { useAllCollection } from './collectionSlice';
import AncestorsPath from './components/AncestorsPath';
import CreateCollectionButton from './components/CreateCollectionButton';
import useParentId from './components/useParentId';
import { useCollectionTable } from './hooks';

export default function Collections() {
  const parentId = useParentId();
  const { data, refetch } = useGetCollectionsQuery({ variables: { parentId } });
  const { fetchData } = useAllCollection();

  const allRefetch = useCallback(async () => {
    await Promise.all([refetch(), fetchData()]);
  }, [refetch, fetchData]);

  const tableInstance = useCollectionTable(allRefetch, data?.getCollections ?? []);

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
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <CustomTable tableInstance={tableInstance} />
    </Box>
  );
}
