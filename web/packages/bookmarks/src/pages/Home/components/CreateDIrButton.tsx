import { Button, Dialog, Box, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CreateDirectoryMutationVariables, useCreateDirectoryMutation } from '../../../graphql';

export interface UploadObjectButtonProps {
  fatherPath: string;
  /** 表格重新刷新 */
  reFetch: () => void;
}

export default function CreateDirButton({ reFetch, fatherPath }: UploadObjectButtonProps): JSX.Element {
  // 表单控制
  const { handleSubmit, register } = useForm<CreateDirectoryMutationVariables>();

  const [createDir] = useCreateDirectoryMutation();

  const onSubmit: SubmitHandler<CreateDirectoryMutationVariables> = async ({ dirName }) => {
    await createDir({ variables: { dirName, fatherPath } });
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
        上传文件
      </Button>
      <Dialog
        PaperProps={{ sx: { maxWidth: 700 } }}
        open={open}
        onClose={handleClose}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>新建文件夹</DialogTitle>
          <DialogContent>
            <TextField
              variant="standard"
              required
              fullWidth
              label="文件夹名"
              {...register('dirName', { required: true })}
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
