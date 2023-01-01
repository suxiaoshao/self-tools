import { Close } from '@mui/icons-material';
import { Button, Dialog, Box, TextField, AppBar, IconButton, Toolbar, Typography, FormLabel } from '@mui/material';
import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { CreateItemMutationVariables, useCreateItemMutation } from '../../../graphql';
import CustomEdit from '../../../components/CustomEdit';

export interface CreateItemButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId: number;
}

export default function CreateItemButton({ refetch, collectionId }: CreateItemButtonProps): JSX.Element {
  type FormData = Omit<CreateItemMutationVariables, 'parentId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>();
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
        <Box sx={{ height: '100%' }} onSubmit={handleSubmit(onSubmit)} component="form">
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
          <Box
            sx={{
              overflow: 'hidden',
              height: 'calc(100% - 64px)',
              display: 'flex',
              flexDirection: 'column',
              padding: 2,
            }}
          >
            <TextField variant="standard" required fullWidth label="项目名" {...register('name', { required: true })} />

            <Controller
              control={control}
              name="content"
              rules={{ required: true }}
              render={({ field }) => (
                <>
                  <FormLabel required sx={{ mt: 2 }}>
                    内容
                  </FormLabel>
                  <CustomEdit
                    sx={{ width: '100%', flex: '1 1 0', borderRadius: 2, overflow: 'hidden' }}
                    language="markdown"
                    {...field}
                  />
                </>
              )}
            />
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
