import { Dialog, Box, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { useI18n } from 'i18n';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CreateCollectionMutationVariables } from '../../../graphql';
import { match } from 'ts-pattern';
export type CollectionFormData = Omit<CreateCollectionMutationVariables, 'parentId'>;
export interface CollectFormProps {
  afterSubmit?: (data: CollectionFormData) => Promise<void>;
  handleClose: () => void;
  open: boolean;
  mode?: 'create' | 'edit';
  initialValues?: CollectionFormData;
}

export default function CollectionForm({
  afterSubmit,
  handleClose,
  open,
  mode = 'create',
  initialValues,
}: CollectFormProps) {
  // 表单控制
  const { handleSubmit, register } = useForm<CollectionFormData>({ defaultValues: initialValues });

  const onSubmit: SubmitHandler<CollectionFormData> = async (data) => {
    await afterSubmit?.(data);
    handleClose();
  };
  const t = useI18n();

  return (
    <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
      <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
        <DialogTitle>
          {match(mode)
            .with('create', () => t('create_collection'))
            .with('edit', () => t('modify_collection'))
            .exhaustive()}
        </DialogTitle>
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
            {...register('description', { setValueAs: (value) => value || null })}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>{t('cancel')}</Button>
          <Button type="submit">{t('submit')}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
