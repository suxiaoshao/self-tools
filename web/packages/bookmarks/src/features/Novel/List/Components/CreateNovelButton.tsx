/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:51:59
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Components/CreateNovelButton.tsx
 */
import { Button, Dialog, Box, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { useI18n } from 'i18n';
import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import AuthorSelect from '../../../../components/AuthorSelect';
import TagsSelect from '../../../../components/TagsSelect';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';
import type { CreateNovelMutationVariables } from '@bookmarks/gql/graphql';

const CreateNovel = graphql(`
  mutation createNovel($data: CreateNovelInput!) {
    createNovel(data: $data) {
      id
    }
  }
`);

export interface CreateNovelButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateNovelButton({ refetch }: CreateNovelButtonProps) {
  type FormData = Omit<CreateNovelMutationVariables['data'], 'collectionId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>({ defaultValues: { tags: [] } });

  const [createNovel] = useMutation(CreateNovel);

  const onSubmit: SubmitHandler<FormData> = async ({ ...formData }) => {
    await createNovel({ variables: { data: { ...formData } } });
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
      <Button
        color="primary"
        size="large"
        variant="contained"
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('add_novel')}
      </Button>
      <Dialog slotProps={{ paper: { sx: { maxWidth: 700 } } }} open={open} onClose={handleClose}>
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
              sx={{ mt: 1 }}
              required
              fullWidth
              label={t('avatar')}
              {...register('avatar', { required: true })}
            />
            <TextField
              required
              sx={{ mt: 1 }}
              fullWidth
              label={t('description')}
              {...register('description', { required: true })}
            />
            <TextField required sx={{ mt: 1 }} fullWidth label={t('link')} {...register('site', { required: true })} />
            <Controller
              control={control}
              name="tags"
              render={({ field }) => <TagsSelect sx={{ mt: 1 }} fullWidth {...field} />}
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
