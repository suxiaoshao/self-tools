/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-29 06:28:45
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-29 07:10:10
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Details/index.tsx
 */
import { useGetAuthorQuery } from '@bookmarks/graphql';
import { getImageUrl } from '@bookmarks/utils/image';
import { CloudDownload, Explore, KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, CardHeader, IconButton, Skeleton, Tooltip, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from 'i18n';
import { useCallback } from 'react';

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
      {data?.getAuthor && (
        <Box>
          <Card>
            <CardHeader
              avatar={<Avatar src={getImageUrl(data.getAuthor.avatar)} />}
              title={data.getAuthor.name}
              action={
                <>
                  <Tooltip title={t('update_by_crawler')}>
                    <IconButton onClick={handleRefresh}>
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
        </Box>
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
