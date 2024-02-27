/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 03:24:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Components/CreateNovelButton.tsx
 */
import { Button, Dialog, Box, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { useI18n } from 'i18n';
import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import AuthorSelect from '../../../../components/AuthorSelect';
import TagsSelect from '../../../../components/TagsSelect';
import { CreateNovelMutationVariables, useCreateNovelMutation } from '../../../../graphql';

export interface CreateNovelButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId?: number | null;
}

export default function CreateNovelButton({ refetch, collectionId }: CreateNovelButtonProps) {
  type FormData = Omit<CreateNovelMutationVariables['data'], 'collectionId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>({ defaultValues: { tags: [] } });

  const [createNovel] = useCreateNovelMutation();

  const onSubmit: SubmitHandler<FormData> = async ({ ...formData }) => {
    await createNovel({ variables: { data: { ...formData, collectionId } } });
    refetch();
    handleClose();
  };
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const t = useI18n();
  return (
    <>
      <Button sx={{ ml: 1 }} color="primary" size="large" variant="contained" onClick={() => setOpen(true)}>
        {t('add_novel')}
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>{t('create_novel')}</DialogTitle>
          <DialogContent>
            <TextField
              required
              sx={{ mt: 1 }}
              fullWidth
              label={t('novel_name')}
              {...register('name', { required: true })}
            />
            <TextField
              required
              sx={{ mt: 1 }}
              fullWidth
              label={t('description')}
              {...register('description', { required: true })}
            />
            <TextField required sx={{ mt: 1 }} fullWidth label={t('link')} {...register('url', { required: true })} />
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
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit">{t('submit')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
