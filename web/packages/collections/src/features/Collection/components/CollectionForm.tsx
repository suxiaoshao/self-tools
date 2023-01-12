import { Dialog, Box, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CreateCollectionMutationVariables } from '../../../graphql';
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

  return (
    <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
      <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
        <DialogTitle>{mode === 'create' ? '新建集合' : '修改集合'}</DialogTitle>
        <DialogContent>
          <TextField variant="standard" required fullWidth label="集合名" {...register('name', { required: true })} />
          <TextField
            sx={{ mt: 1 }}
            variant="standard"
            fullWidth
            label="描述"
            {...register('description', { setValueAs: (value) => value || null })}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button type="submit">提交</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
