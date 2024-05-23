/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-28 04:24:47
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:57:11
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Details/index.tsx
 */
import { useGetNovelQuery } from '@bookmarks/graphql';
import { Explore, KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Typography,
  Link,
  Skeleton,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from 'i18n';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { getImageUrl } from '@bookmarks/utils/image';
import Chapters from './components/Chapters';
import { useCallback } from 'react';

export default function NovelDetails() {
  const { novelId } = useParams();
  const { data, loading, refetch } = useGetNovelQuery({ variables: { id: Number(novelId) } });
  const t = useI18n();
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const goToSourceSite = useCallback(() => {
    if (data?.getNovel?.url) {
      window.open(data.getNovel.url, '_blank');
    }
  }, [data?.getNovel?.url]);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2, gap: 2 }}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <IconButton onClick={() => navigate(-1)}>
          <KeyboardArrowLeft />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleRefresh}>
          <Refresh />
        </IconButton>
      </Box>
      {data?.getNovel && (
        <>
          <Card>
            <CardHeader
              avatar={<Avatar src={getImageUrl(data.getNovel.avatar)} />}
              title={data.getNovel.name}
              subheader={data.getNovel.author.name}
              action={
                <>
                  <Tooltip title={t('update_by_crawler')}>
                    <IconButton onClick={() => refetch()}>
                      <CloudDownloadIcon />
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
                {data.getNovel.description}
              </Typography>
              <Typography color={'textSecondary'}>
                {t('author')} :{' '}
                <Link to={`/bookmarks/authors/${data.getNovel.author.id}`} component={RouterLink}>
                  {data.getNovel.author.name}
                </Link>
              </Typography>
            </CardContent>
          </Card>
          <Chapters chapters={data.getNovel.chapters} />
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
