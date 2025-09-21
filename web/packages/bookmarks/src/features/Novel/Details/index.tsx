/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-28 04:24:47
 * @LastEditors: suxiaoshao 48886207+suxiaoshao@users.noreply.github.com
 * @LastEditTime: 2025-09-18 09:41:12
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Details/index.tsx
 */
import { useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import useTitle from '@bookmarks/hooks/useTitle';
import { getImageUrl } from '@bookmarks/utils/image';
import CustomMarkdown from '@collections/components/Markdown';
import { Delete, Explore, KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { Avatar, Box, Card, CardContent, CardHeader, IconButton, Skeleton, Tooltip } from '@mui/material';
import { Details } from 'details';
import { useI18n } from 'i18n';
import { enqueueSnackbar } from 'notify';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { P, match } from 'ts-pattern';
import Chapters from './components/Chapters';
import CommentEdit from './components/CommentEdit';
import useNovelDetailItems from './useNovelDetailItems';

const GetNovel = graphql(`
  query getNovel($id: Int!) {
    getNovel(id: $id) {
      id
      name
      avatar
      description
      createTime
      updateTime
      description
      novelStatus
      url
      chapters {
        id
        title
        createTime
        updateTime
        url
        wordCount
        time
        isRead
      }
      author {
        avatar
        description
        id
        name
        site
      }
      lastChapter {
        time
      }
      firstChapter {
        time
      }
      wordCount
      tags {
        url
        name
        id
      }
      site
      collections {
        name
        id
        description
        path
      }
      comments {
        content
      }
    }
  }
`);

const UpdateNovelByCrawler = graphql(`
  mutation updateNovelByCrawler($novelId: Int!) {
    updateNovelByCrawler(novelId: $novelId) {
      id
    }
  }
`);
const DeleteCommentForNovel = graphql(`
  mutation deleteCommentForNovel($novelId: Int!) {
    deleteCommentForNovel(novelId: $novelId) {
      __typename
    }
  }
`);

export default function NovelDetails() {
  // fetch data
  const { novelId } = useParams();
  const { data, loading, refetch } = useQuery(GetNovel, { variables: { id: Number(novelId) } });

  // title
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
  const [updateNovel, { loading: updateLoading }] = useMutation(UpdateNovelByCrawler);
  const handleUpdateNovel = useCallback(async () => {
    await updateNovel({ variables: { novelId: Number(novelId) } });
    enqueueSnackbar(t('update_by_crawler_success'), { variant: 'success' });
    refetch();
  }, [novelId, updateNovel, refetch, t]);
  const items = useNovelDetailItems(data, refetch);
  const [deleteComment] = useMutation(DeleteCommentForNovel, { variables: { novelId: data?.getNovel?.id } });
  const handleDeleteComment = async () => {
    await deleteComment({ variables: { novelId: data?.getNovel?.id } });
    refetch();
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', width: '100%', pl: 2, pr: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <KeyboardArrowLeft />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleRefresh}>
          <Refresh />
        </IconButton>
      </Box>
      <Box sx={{ flex: '1 1 0', overflow: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  <Details items={items} sx={{ gap: 1 }} fullSpan={4} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader
                  title={t('comment')}
                  action={
                    <>
                      <CommentEdit
                        refetch={refetch}
                        novelId={data.getNovel.id}
                        mode={match(data.getNovel.comments?.content)
                          .with(P.nonNullable, () => 'update' as const)
                          .otherwise(() => 'create' as const)}
                        initContent={data.getNovel.comments?.content}
                      />
                      {data.getNovel.comments?.content && (
                        <Tooltip title={t('delete')}>
                          <IconButton onClick={handleDeleteComment}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  }
                />
                <CardContent>
                  <CustomMarkdown value={data.getNovel.comments?.content || '-'} />
                </CardContent>
              </Card>
              <Chapters chapters={data.getNovel.chapters} refetch={refetch} novelId={data.getNovel.id} />
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
      </Box>
    </Box>
  );
}
