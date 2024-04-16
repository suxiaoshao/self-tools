/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-01 17:53:40
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 19:56:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/index.tsx
 */
import {
  useFetchAuthorLazyQuery,
  FetchAuthorQueryVariables,
  NovelSite,
  useSaveDraftAuthorMutation,
} from '@bookmarks/graphql';
import {
  Avatar,
  Backdrop,
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { Save, Search } from '@mui/icons-material';
import { getImageUrl } from '@bookmarks/utils/image';
import ChapterModal from '@bookmarks/components/ChapterModal';
import { convertFetchToDraftAuthor } from './utils';
import { enqueueSnackbar } from 'notify';

export default function AuthorFetch() {
  type FormData = FetchAuthorQueryVariables;
  const [fn, { data, loading }] = useFetchAuthorLazyQuery();
  const { handleSubmit, register, control } = useForm<FormData>();
  const t = useI18n();
  const onSubmit = handleSubmit((data) => {
    fn({ variables: data });
  });
  const author = data?.fetchAuthor;
  const [saveDraftAuthor, { loading: saveLoading }] = useSaveDraftAuthorMutation();
  return (
    <Box
      onSubmit={onSubmit}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2, gap: 2 }}
      component="form"
    >
      <Card>
        <CardHeader
          title={t('filter')}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('fetch')}>
                <IconButton type="submit">
                  <Search />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('save_draft')}>
                <IconButton
                  disabled={!author || saveLoading}
                  onClick={async () => {
                    if (author) {
                      await saveDraftAuthor({ variables: { author: convertFetchToDraftAuthor(author) } });
                      enqueueSnackbar(t('save_draft_success'), { variant: 'success' });
                    }
                  }}
                >
                  <Save />
                </IconButton>
              </Tooltip>
              <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saveLoading}>
                <CircularProgress color="inherit" />
              </Backdrop>
            </Box>
          }
        />
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <Controller
            control={control}
            name="novelSite"
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
          <TextField required fullWidth label={t('author_id')} {...register('id', { required: true })} />
        </CardContent>
      </Card>
      {loading && (
        <Card>
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" width={210} height={60} />
          <Skeleton variant="rounded" width={210} height={60} />
        </Card>
      )}
      {author && !loading && (
        <Card sx={{ flex: '1 1 0', overflowY: 'auto' }}>
          <CardHeader
            avatar={<Avatar src={getImageUrl(author.image)} />}
            title={author.name}
            subheader={author.description}
          />
          <CardContent sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
            {author.novels.map((novel) => (
              <Box key={novel.url} sx={{ display: 'flex', gap: 1 }}>
                <Box src={getImageUrl(novel.image)} sx={{ display: 'inline-block', width: '100px' }} component="img" />
                <Box sx={{ flex: '1 1 0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">{novel.name}</Typography>
                    <ChapterModal chapters={novel.chapters} />
                  </Box>
                  <Typography variant="body2">{novel.description}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
