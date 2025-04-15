/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:52:09
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/List/components/CreateAuthorButton.tsx
 */
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useState } from 'react';
import { type CreateAuthorMutationVariables, useCreateAuthorMutation } from '../../../../graphql';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';

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
  const t = useI18n();
  return (
    <>
      <Button sx={{ ml: 1 }} color="primary" size="large" variant="contained" onClick={() => setOpen(true)}>
        {t('add_author')}
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>{t('create_author')}</DialogTitle>
          <DialogContent>
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('author_name')}
              {...register('name', { required: true })}
            />
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('avatar')}
              {...register('avatar', { required: true })}
            />
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('link')}
              {...register('site', { required: true })}
            />
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('description')}
              {...register('description', { required: true })}
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
