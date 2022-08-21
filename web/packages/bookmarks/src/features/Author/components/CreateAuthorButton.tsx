import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState } from 'react';
import { CreateAuthorMutationVariables, useCreateAuthorMutation } from '../../../graphql';
import { SubmitHandler, useForm } from 'react-hook-form';

export interface CreateAuthorButtonProps {
  refetch: () => void;
}

export default function CreateAuthorButton({ refetch }: CreateAuthorButtonProps) {
  const [createAuthor] = useCreateAuthorMutation();
  // 表单控制
  type FormData = CreateAuthorMutationVariables;
  const { handleSubmit, register } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await createAuthor({ variables: { ...data } });
    refetch();
    handleClose();
  };
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Button sx={{ ml: 1 }} color="primary" size="large" variant="contained" onClick={() => setOpen(true)}>
        添加作者
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>新建标签</DialogTitle>
          <DialogContent>
            <TextField variant="standard" required fullWidth label="作者名" {...register('name', { required: true })} />
            <TextField variant="standard" required fullWidth label="头像" {...register('avatar', { required: true })} />
            <TextField variant="standard" required fullWidth label="链接" {...register('url', { required: true })} />
            <TextField
              variant="standard"
              required
              fullWidth
              label="描述"
              {...register('description', { required: true })}
            />
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
