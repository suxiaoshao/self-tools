import { Button, Dialog, Box, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CreateCollectionMutationVariables, useCreateCollectionMutation } from '../../../graphql';
import useParentId from './useParentId';

export interface UploadObjectButtonProps {
  /** 表格重新刷新 */
  reFetch: () => void;
}

export default function CreateCollectionButton({ reFetch }: UploadObjectButtonProps): JSX.Element {
  const parentId = useParentId();
  type FormData = Omit<CreateCollectionMutationVariables, 'parentId'>;
  // 表单控制
  const { handleSubmit, register } = useForm<FormData>();

  const [createCollection] = useCreateCollectionMutation();

  const onSubmit: SubmitHandler<FormData> = async ({ name, description }) => {
    await createCollection({ variables: { name, parentId, description } });
    reFetch();
    handleClose();
  };
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Button color="primary" size="large" variant="contained" onClick={() => setOpen(true)}>
        添加集合
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>新建文件夹</DialogTitle>
          <DialogContent>
            <TextField
              variant="standard"
              required
              fullWidth
              label="文件夹名"
              {...register('name', { required: true })}
            />
            <TextField sx={{ mt: 1 }} variant="standard" fullWidth label="描述" {...register('description')} />
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>取消</Button>
            <Button type="submit">提交</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
