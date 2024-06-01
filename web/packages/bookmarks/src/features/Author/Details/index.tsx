/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-29 06:28:45
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-29 07:10:10
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Details/index.tsx
 */
import { NovelStatus, useGetAuthorQuery, useUpdateAuthorByCrawlerMutation } from '@bookmarks/graphql';
import { getImageUrl } from '@bookmarks/utils/image';
import { CloudDownload, Explore, KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Link,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useI18n } from 'i18n';
import { useCallback } from 'react';
import { enqueueSnackbar } from 'notify';
import { P, match } from 'ts-pattern';
import { Details, DetailsItem } from 'details';
import { format } from 'time';

export default function AuthorDetails() {
  const t = useI18n();
  const { authorId } = useParams();
  const { data, loading, refetch } = useGetAuthorQuery({ variables: { id: Number(authorId) } });
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const goToSourceSite = useCallback(() => {
    if (data?.getAuthor?.url) {
      window.open(data.getAuthor.url, '_blank');
    }
  }, [data?.getAuthor?.url]);
  const [updateAuthor, { loading: updateLoading }] = useUpdateAuthorByCrawlerMutation();
  const handleUpdateAuthor = useCallback(async () => {
    await updateAuthor({ variables: { authorId: Number(authorId) } });
    enqueueSnackbar(t('update_by_crawler_success'), { variant: 'success' });
    refetch();
  }, [authorId, refetch, updateAuthor, t]);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2, gap: 2, pb: 0 }}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <IconButton onClick={() => navigate(-1)}>
          <KeyboardArrowLeft />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleRefresh}>
          <Refresh />
        </IconButton>
      </Box>
      {data?.getAuthor && (
        <>
          <Card>
            <CardHeader
              avatar={<Avatar src={getImageUrl(data.getAuthor.avatar)} />}
              title={data.getAuthor.name}
              action={
                <>
                  <Tooltip title={t('update_by_crawler')}>
                    <IconButton disabled={updateLoading} onClick={handleUpdateAuthor}>
                      <CloudDownload />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('go_to_source_site')}>
                    <IconButton onClick={goToSourceSite}>
                      <Explore />
                    </IconButton>
                  </Tooltip>
                </>
              }
            />
            <CardContent>
              <Typography variant="body2" component="p" gutterBottom>
                {data.getAuthor.description}
              </Typography>
            </CardContent>
          </Card>
          <Box
            sx={{
              flex: '1 1 0',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: (theme) => `repeat(auto-fill, minmax(${theme.spacing(40)},1fr))`,
              gridTemplateRows: 'masonry',
              gap: 2,
              gridAutoRows: 'max-content',
              pb: 2,
            }}
          >
            {data?.getAuthor.novels.map(
              ({ id, avatar, name, description, url, novelStatus, wordCount, lastChapter, firstChapter }) => (
                <Card key={id}>
                  <CardHeader
                    avatar={<Avatar src={getImageUrl(avatar)} />}
                    title={
                      <Link to={`/bookmarks/novel/${id}`} component={RouterLink}>
                        {name}
                      </Link>
                    }
                    subheader={match(novelStatus)
                      .with(NovelStatus.Ongoing, () => (
                        <Chip variant="outlined" size="small" color="warning" label={t('ongoing')} />
                      ))
                      .with(NovelStatus.Completed, () => (
                        <Chip variant="outlined" size="small" color="secondary" label={t('completed')} />
                      ))
                      .exhaustive()}
                    action={
                      <Tooltip title={t('go_to_source_site')}>
                        <IconButton onClick={() => window.open(url, '_blank')}>
                          <Explore />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" component="p" gutterBottom>
                      {description}
                    </Typography>
                    <Details
                      fullSpan={2}
                      items={
                        [
                          {
                            label: t('novel_status'),
                            value: match(novelStatus)
                              .with(NovelStatus.Ongoing, () => t('ongoing'))
                              .with(NovelStatus.Completed, () => t('completed'))
                              .exhaustive(),
                          },
                          {
                            label: t('word_count'),
                            value: wordCount,
                          },
                          {
                            label: t('last_update_time'),
                            value: match(lastChapter?.time)
                              .with(P.string, (data) => format(data))
                              .otherwise(() => '-'),
                          },
                          {
                            label: t('first_chapter_time'),
                            value: match(firstChapter?.time)
                              .with(P.string, (data) => format(data))
                              .otherwise(() => '-'),
                          },
                        ] satisfies DetailsItem[]
                      }
                    />
                  </CardContent>
                </Card>
              ),
            )}
          </Box>
        </>
      )}
      {loading && (
        <Card>
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" width={210} height={60} />
          <Skeleton variant="rounded" width={210} height={60} />
        </Card>
      )}
    </Box>
  );
}
