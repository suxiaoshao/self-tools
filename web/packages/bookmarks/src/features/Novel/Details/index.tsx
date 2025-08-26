/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-28 04:24:47
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:57:11
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Details/index.tsx
 */
import {
  useDeleteCollectionForNovelMutation,
  useGetNovelQuery,
  useUpdateNovelByCrawlerMutation,
} from '@bookmarks/graphql';
import { Explore, KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, CardHeader, IconButton, Tooltip, Link, Skeleton, Chip } from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from 'i18n';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { getImageUrl } from '@bookmarks/utils/image';
import Chapters from './components/Chapters';
import { useCallback, useMemo } from 'react';
import { enqueueSnackbar } from 'notify';
import { Details, type DetailsItem } from 'details';
import { P, match } from 'ts-pattern';
import { format } from 'time';
import AddCollection from './components/AddCollection';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import useTitle from '@bookmarks/hooks/useTitle';

export default function NovelDetails() {
  const { novelId } = useParams();
  const { data, loading, refetch } = useGetNovelQuery({ variables: { id: Number(novelId) } });
  const t = useI18n();
  useTitle(t('novel_detail', { novelName: data?.getNovel?.name }));
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const goToSourceSite = useCallback(() => {
    if (data?.getNovel?.url) {
      window.open(data.getNovel.url, '_blank');
    }
  }, [data?.getNovel?.url]);
  const [updateNovel, { loading: updateLoading }] = useUpdateNovelByCrawlerMutation();
  const handleUpdateNovel = useCallback(async () => {
    await updateNovel({ variables: { novelId: Number(novelId) } });
    enqueueSnackbar(t('update_by_crawler_success'), { variant: 'success' });
    refetch();
  }, [novelId, updateNovel, refetch, t]);
  const [deleteCollectionForNovel] = useDeleteCollectionForNovelMutation();
  const items = useMemo<DetailsItem[]>(
    () =>
      match(data?.getNovel)
        .with(
          P.nonNullable,
          (data) =>
            [
              {
                label: t('author'),
                value: (
                  <Link to={`/bookmarks/authors/${data.author.id}`} component={RouterLink}>
                    {data.author.name}
                  </Link>
                ),
              },
              {
                label: t('novel_status'),
                value: getLabelKeyByNovelStatus(data.novelStatus),
              },
              {
                label: t('word_count'),
                value: data.wordCount,
              },
              {
                label: t('last_update_time'),
                value: match(data.lastChapter?.time)
                  .with(P.string, (data) => format(data as string))
                  .otherwise(() => '-'),
              },
              {
                label: t('first_chapter_time'),
                value: match(data.firstChapter?.time)
                  .with(P.string, (data) => format(data))
                  .otherwise(() => '-'),
              },
              {
                label: t('tags'),
                value: match(data.tags?.length)
                  .with(P.nullish, () => '-')
                  .with(0, () => '-')
                  .otherwise(() => (
                    <Box sx={{ gap: 1, display: 'flex' }}>
                      {data.tags.map((tag) => (
                        <Chip
                          color="primary"
                          variant="outlined"
                          label={tag.name}
                          onClick={() => {
                            window.open(tag.url, '_blank');
                          }}
                          key={tag.id}
                        />
                      ))}
                    </Box>
                  )),
                span: 3,
              },
              {
                label: t('collections'),
                value: (
                  <Box sx={{ gap: 1, display: 'flex' }}>
                    {data.collections.map(({ id, name }) => (
                      <Chip
                        color="primary"
                        variant="outlined"
                        label={name}
                        onClick={() => {
                          navigate(`/bookmarks/collections?parentId=${id}`);
                        }}
                        onDelete={async () => {
                          await deleteCollectionForNovel({ variables: { collectionId: id, novelId: data.id } });
                          refetch();
                        }}
                        key={id}
                      />
                    ))}
                    <AddCollection novelId={data.id} refetch={refetch} />
                  </Box>
                ),
                span: 3,
              },
              {
                label: t('description'),
                value: data.description,
                span: 3,
              },
            ] satisfies DetailsItem[],
        )
        .otherwise(() => []),
    [data, t, deleteCollectionForNovel, navigate, refetch],
  );
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
                    <IconButton disabled={updateLoading} onClick={handleUpdateNovel}>
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
              <Details items={items} />
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
