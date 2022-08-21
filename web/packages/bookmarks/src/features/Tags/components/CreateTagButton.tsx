import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState } from 'react';
import { CreateTagMutationVariables, useCreateTagMutation } from '../../../graphql';
import { SubmitHandler, useForm } from 'react-hook-form';

export interface CreateTagButtonProps {
  refetch: () => void;
  collectionId: number | undefined | null;
}

export default function CreateTagButton({ refetch, collectionId }: CreateTagButtonProps): JSX.Element {
  const [createTag] = useCreateTagMutation();

  // 表单控制
  type FormData = Omit<CreateTagMutationVariables, 'collectionId'>;
  const { handleSubmit, register } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = async ({ name }) => {
    await createTag({ variables: { name, collectionId } });
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
        添加标签
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>新建标签</DialogTitle>
          <DialogContent>
            <TextField variant="standard" required fullWidth label="标签名" {...register('name', { required: true })} />
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
