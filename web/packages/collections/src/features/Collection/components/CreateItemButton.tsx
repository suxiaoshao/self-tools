import { Close } from '@mui/icons-material';
import { Button, Dialog, Box, DialogContent, TextField, AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CreateItemMutationVariables, useCreateItemMutation } from '../../../graphql';

export interface CreateItemButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId: number;
}

export default function CreateItemButton({ refetch, collectionId }: CreateItemButtonProps): JSX.Element {
  type FormData = Omit<CreateItemMutationVariables, 'parentId'>;
  // 表单控制
  const { handleSubmit, register } = useForm<FormData>();

  const [createItem] = useCreateItemMutation();

  const onSubmit: SubmitHandler<FormData> = async ({ name, content }) => {
    await createItem({ variables: { name, collectionId, content } });
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
      <Button color="secondary" sx={{ ml: 2 }} size="large" variant="contained" onClick={() => setOpen(true)}>
        添加项目
      </Button>
      <Dialog fullScreen open={open} onClose={handleClose}>
        <Box onSubmit={handleSubmit(onSubmit)} component="form">
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                新建项目
              </Typography>
              <Button autoFocus type="submit" color="inherit">
                提交
              </Button>
            </Toolbar>
          </AppBar>
          <DialogContent>
            <TextField variant="standard" required fullWidth label="项目名" {...register('name', { required: true })} />
            <TextField sx={{ mt: 1 }} variant="standard" fullWidth label="内容" {...register('content')} />
          </DialogContent>
        </Box>
      </Dialog>
    </>
  );
}
