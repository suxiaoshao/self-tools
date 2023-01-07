import { Button, Dialog, Box, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import AuthorSelect from '../../../components/AuthorSelect';
import TagsSelect from '../../../components/TagsSelect';
import { CreateNovelMutationVariables, useCreateNovelMutation } from '../../../graphql';

export interface CreateNovelButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId?: number | null;
}

export default function CreateNovelButton({ refetch, collectionId }: CreateNovelButtonProps) {
  type FormData = Omit<CreateNovelMutationVariables, 'collectionId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>({ defaultValues: { tags: [] } });

  const [createNovel] = useCreateNovelMutation();

  const onSubmit: SubmitHandler<FormData> = async ({ ...formData }) => {
    await createNovel({ variables: { ...formData, collectionId } });
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
        添加小说
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>新建小说</DialogTitle>
          <DialogContent>
            <TextField required sx={{ mt: 1 }} fullWidth label="小说名" {...register('name', { required: true })} />
            <TextField
              required
              sx={{ mt: 1 }}
              fullWidth
              label="描述"
              {...register('description', { required: true })}
            />
            <Controller
              control={control}
              name="tags"
              render={({ field }) => <TagsSelect sx={{ mt: 1 }} fullWidth collectionId={collectionId} {...field} />}
            />
            <Controller
              rules={{ required: true }}
              control={control}
              name="authorId"
              render={({ field }) => <AuthorSelect sx={{ mt: 1 }} fullWidth {...field} />}
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
