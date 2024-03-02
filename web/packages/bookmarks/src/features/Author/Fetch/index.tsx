/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-01 17:53:40
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-02 20:08:27
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/index.tsx
 */
import { useFetchAuthorLazyQuery, FetchAuthorQueryVariables, NovelSite } from '@bookmarks/graphql';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { Search } from '@mui/icons-material';
import { getImageUrl } from '@bookmarks/utils/image';
import ViewListIcon from '@mui/icons-material/ViewList';

export default function AuthorFetch() {
  type FormData = FetchAuthorQueryVariables;
  const [fn, { data, loading }] = useFetchAuthorLazyQuery();
  const { handleSubmit, register, control } = useForm<FormData>();
  const t = useI18n();
  const onSubmit = handleSubmit((data) => {
    fn({ variables: data });
  });
  const author = data?.fetchAuthor;
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
            <Tooltip title={t('fetch')}>
              <IconButton type="submit">
                <Search />
              </IconButton>
            </Tooltip>
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
                    <Tooltip title={t('view_novel_chapters')}>
                      <IconButton href={novel.url} target="_blank">
                        <ViewListIcon />
                      </IconButton>
                    </Tooltip>
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
