/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-28 04:24:47
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:57:11
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Details/index.tsx
 */
import { useGetNovelQuery } from '@bookmarks/graphql';
import { KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, CardHeader, IconButton, Tooltip, Typography, Link } from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from 'i18n';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { getImageUrl } from '@bookmarks/utils/image';

export default function NovelDetails() {
  const { novelId } = useParams();
  const { data, loading, refetch } = useGetNovelQuery({ variables: { id: Number(novelId) } });
  const t = useI18n();
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        <IconButton onClick={() => navigate(-1)}>
          <KeyboardArrowLeft />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      {data?.getNovel && (
        <Card
          sx={{
            margin: 1,
            marginTop: 0,
            height: (theme) => `calc(100% - ${theme.spacing(1)})`,
            overflow: 'auto',
          }}
        >
          <CardHeader
            avatar={<Avatar src={getImageUrl(data.getNovel.avatar)} />}
            title={data.getNovel.name}
            subheader={data.getNovel.author.name}
            action={
              <Tooltip title={t('refresh')}>
                <IconButton onClick={() => refetch()}>
                  <CloudDownloadIcon />
                </IconButton>
              </Tooltip>
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
            <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
              {data.getNovel.chapters.map((value) => (
                <Link key={value.id} to={`/novel/${novelId}/chapter/${value.id}`} component={RouterLink}>
                  <Typography>{value.title}</Typography>
                </Link>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
