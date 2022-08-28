import { Refresh } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { CustomTable } from 'custom-table';
import { Controller, useForm } from 'react-hook-form';
import CollectionSelect from '../../components/CollectionSelect';
import { CreateNovelMutationVariables, useDeleteNovelMutation, useGetNovelsQuery } from '../../graphql';
import CreateTagButton from '../Tags/components/CreateTagButton';

export default function Novel() {
  type FormData = CreateNovelMutationVariables;
  const { control, watch } = useForm<FormData>();
  const collectionId = watch('collectionId');
  const { data: { queryNovels } = {}, refetch } = useGetNovelsQuery({ variables: { collectionId } });
  const [deleteNovel] = useDeleteNovelMutation();
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
