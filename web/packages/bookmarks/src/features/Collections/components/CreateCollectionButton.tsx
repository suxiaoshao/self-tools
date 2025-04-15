import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useI18n } from 'i18n';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { type CreateCollectionMutationVariables, useCreateCollectionMutation } from '../../../graphql';
import { useAllCollection } from '../collectionSlice';
import useParentId from './useParentId';

export interface CreateCollectButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateCollectionButton({ refetch }: CreateCollectButtonProps) {
  const parentId = useParentId();
  const { fetchData } = useAllCollection();

  type FormData = Omit<CreateCollectionMutationVariables, 'parentId'>;
  // 表单控制
  const { handleSubmit, register } = useForm<FormData>();

  const [createCollection] = useCreateCollectionMutation();

  const onSubmit: SubmitHandler<FormData> = async ({ name, description }) => {
    await createCollection({ variables: { name, parentId, description } });
    refetch();
    handleClose();
    await fetchData();
  };
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const t = useI18n();
  return (
    <>
      <Button color="primary" size="large" variant="contained" onClick={() => setOpen(true)}>
        {t('add_collection')}
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>{t('create_collection')}</DialogTitle>
          <DialogContent>
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('collection_name')}
              {...register('name', { required: true })}
            />
            <TextField
              sx={{ mt: 1 }}
              variant="standard"
              fullWidth
              label={t('description')}
              {...register('description')}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit">{t('submit')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
