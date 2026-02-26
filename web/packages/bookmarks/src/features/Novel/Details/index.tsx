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
import { Delete, RefreshCcw, Download, SquareArrowOutUpRight, ChevronLeft } from 'lucide-react';
import { Details } from 'details';
import { useI18n } from 'i18n';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { P, match } from 'ts-pattern';
import Chapters from './components/Chapters';
import CommentEdit from './components/CommentEdit';
import useNovelDetailItems from './useNovelDetailItems';
import { toast } from 'sonner';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@portal/components/ui/card';
import { Skeleton } from '@portal/components/ui/skeleton';
import { Button } from '@portal/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@portal/components/ui/item';
import { Avatar, AvatarFallback, AvatarImage } from '@portal/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';

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
    toast.success(t('update_by_crawler_success'));
    refetch();
  }, [novelId, updateNovel, refetch, t]);
  const items = useNovelDetailItems(data, refetch);
  const [deleteComment] = useMutation(DeleteCommentForNovel, { variables: { novelId: data?.getNovel?.id } });
  const handleDeleteComment = async () => {
    await deleteComment({ variables: { novelId: data?.getNovel?.id } });
    refetch();
  };
  return (
    <div className="flex flex-col size-full h-screen">
      <div className="flex w-full p-4 pb-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <div className="grow" />
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCcw />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 overscroll-contain">
        <div className="flex flex-col gap-4">
          {data?.getNovel && (
            <>
              <Card>
                <Item className="pt-0 px-6">
                  <ItemMedia>
                    <Avatar className="size-10">
                      <AvatarImage src={getImageUrl(data.getNovel.avatar)} />
                      <AvatarFallback>{data.getNovel.name[0]}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{data.getNovel.name}</ItemTitle>
                    <ItemDescription>{data.getNovel.author.name}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button variant="ghost" size="icon" disabled={updateLoading} onClick={handleUpdateNovel} />
                        }
                      >
                        <Download />
                      </TooltipTrigger>
                      <TooltipContent>{t('update_by_crawler')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={goToSourceSite} />}>
                        <SquareArrowOutUpRight />
                      </TooltipTrigger>
                      <TooltipContent>{t('go_to_source_site')}</TooltipContent>
                    </Tooltip>
                  </ItemActions>
                </Item>
                <CardContent>
                  <Details items={items} className="gap-2" fullSpan={4} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('comment')}</CardTitle>
                  <CardAction>
                    <CommentEdit
                      refetch={refetch}
                      novelId={data.getNovel.id}
                      mode={match(data.getNovel.comments?.content)
                        .with(P.nonNullable, () => 'update' as const)
                        .otherwise(() => 'create' as const)}
                      initContent={data.getNovel.comments?.content}
                    />
                    {data.getNovel.comments?.content && (
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="ghost" size="icon" onClick={handleDeleteComment} />}>
                          <Delete />
                        </TooltipTrigger>
                        <TooltipContent>{t('delete')}</TooltipContent>
                      </Tooltip>
                    )}
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <CustomMarkdown value={data.getNovel.comments?.content || '-'} />
                </CardContent>
              </Card>
              <Chapters chapters={data.getNovel.chapters} refetch={refetch} novelId={data.getNovel.id} />
            </>
          )}
          {loading && (
            <Card>
              <CardContent className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
