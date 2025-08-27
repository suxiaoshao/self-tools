import type { CreateCollectionMutationVariables } from '@bookmarks/gql/graphql';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { match } from 'ts-pattern';

export enum CollectionFormType {
  create = 'create',
  edit = 'edit',
}

export type CollectionFormData = Omit<CreateCollectionMutationVariables, 'parentId'>;

export interface CollectionFormProps {
  afterSubmit?: (data: CollectionFormData) => Promise<void>;
  open: boolean;
  handleClose: () => void;
  mode?: CollectionFormType;
  initialValues?: CollectionFormData;
}

export default function CollectionForm({
  open,
  handleClose,
  afterSubmit,
  initialValues,
  mode = CollectionFormType.create,
}: CollectionFormProps) {
  // 表单控制
  const { handleSubmit, register } = useForm<CollectionFormData>({ defaultValues: initialValues });
  const onSubmit: SubmitHandler<CollectionFormData> = async (data) => {
    await afterSubmit?.(data);
  };
  const t = useI18n();
  return (
    <Dialog slotProps={{ paper: { sx: { maxWidth: 700 } } }} open={open} onClose={handleClose}>
      <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
        <DialogTitle>
          {match(mode)
            .with(CollectionFormType.create, () => t('create_collection'))
            .with(CollectionFormType.edit, () => t('modify_collection'))
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
