import { useMutation } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import type { CreateCommentMutationVariables } from '@bookmarks/gql/graphql';
import CustomEdit from '@collections/components/CustomEdit';
import useDialog from '@collections/hooks/useDialog';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Close, Edit } from '@mui/icons-material';
import {
  AppBar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useI18n } from 'i18n';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { minLength, object, pipe, string } from 'valibot';

const CreateCommentSchema = object({
  content: pipe(string(), minLength(1)),
});

const CreateComment = graphql(`
  mutation CreateComment($novelId: Int!, $content: String!) {
    addCommentForNovel(novelId: $novelId, content: $content) {
      __typename
    }
  }
`);

const UpdateComment = graphql(`
  mutation UpdateComment($novelId: Int!, $content: String!) {
    updateCommentForNovel(novelId: $novelId, content: $content) {
      __typename
    }
  }
`);

export interface CommentEditProps {
  novelId: number;
  refetch: () => void;
  mode: 'create' | 'update';
  initContent?: string;
}

export default function CommentEdit({ novelId, refetch, mode, initContent }: CommentEditProps) {
  const t = useI18n();
  const { open, handleClose, handleOpen } = useDialog();
  const [createComment, { loading }] = useMutation(CreateComment);
  const [updateComment, { loading: updateLoading }] = useMutation(UpdateComment);
  const { handleSubmit, control } = useForm<Omit<CreateCommentMutationVariables, 'novelId'>>({
    resolver: valibotResolver(CreateCommentSchema),
    defaultValues: {
      content: initContent,
    },
  });
  const onSubmit = async (data: Omit<CreateCommentMutationVariables, 'novelId'>) => {
    if (mode === 'update') {
      await updateComment({ variables: { ...data, novelId } });
    } else {
      await createComment({ variables: { ...data, novelId } });
    }
    handleClose();
    refetch();
  };

  return (
    <>
      <Dialog fullScreen open={open} onClose={handleClose}>
        <Box sx={{ height: '100%' }} onSubmit={handleSubmit(onSubmit)} component="form">
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton edge="start" color="secondary" onClick={handleClose} aria-label="close">
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                {match(mode)
                  .with('create', () => t('add_comment'))
                  .with('update', () => t('update_comment'))
                  .exhaustive()}
              </Typography>
              <Button type="submit" color="inherit">
                {t('submit')}
              </Button>
            </Toolbar>
          </AppBar>
          <Box
            sx={{
              overflow: 'hidden',
              height: 'calc(100% - 64px)',
              padding: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl sx={{ height: '100%' }} error={!!fieldState.error}>
                  <FormLabel id="color-setting">{t('content')}</FormLabel>
                  <CustomEdit
                    wordWrap="on"
                    sx={{ width: '100%', flex: '1 1 0', borderRadius: 2, overflow: 'hidden' }}
                    language="markdown"
                    {...field}
                  />
                  {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Box>
        </Box>
        <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading || updateLoading}>
          <CircularProgress />
        </Backdrop>
      </Dialog>
      <Tooltip title={t('edit')}>
        <IconButton onClick={handleOpen}>
          <Edit />
        </IconButton>
      </Tooltip>
    </>
  );
}
