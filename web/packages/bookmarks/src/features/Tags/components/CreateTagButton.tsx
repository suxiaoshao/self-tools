import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';
import { NovelSite, type CreateTagMutationVariables } from '@bookmarks/gql/graphql';

const CreateTag = graphql(`
  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {
    createTag(name: $name, site: $site, siteId: $siteId) {
      name
      id
    }
  }
`);
export interface CreateTagButtonProps {
  refetch: () => void;
}

export default function CreateTagButton({ refetch }: CreateTagButtonProps) {
  const [createTag] = useMutation(CreateTag);

  // 表单控制
  type FormData = Omit<CreateTagMutationVariables, 'collectionId'>;
  const { handleSubmit, register, control } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = async ({ name, site, siteId }) => {
    await createTag({ variables: { name, site, siteId } });
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
        sx={{ ml: 1 }}
        color="primary"
        size="large"
        variant="contained"
        onClick={() => {
          setOpen(true);
        }}
      >
        {t('add_tag')}
      </Button>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>{t('create_tag')}</DialogTitle>
          <DialogContent>
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('tag_name')}
              {...register('name', { required: true })}
            />
            <Controller
              control={control}
              name="site"
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <TextField
                  error={!!fieldState?.error?.message}
                  helperText={fieldState?.error?.message}
                  select
                  label={t('novel_site')}
                  required
                  fullWidth
                  {...field}
                >
                  <MenuItem value={NovelSite.Jjwxc}>{t('jjwxc')}</MenuItem>
                  <MenuItem value={NovelSite.Qidian}>{t('qidian')}</MenuItem>
                </TextField>
              )}
            />
            <TextField
              variant="standard"
              required
              fullWidth
              label={t('tag_site_id')}
              {...register('siteId', { required: true })}
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
