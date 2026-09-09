import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
import { RequestNotice, hasQueryFailure } from 'custom-graphql';
import { checkNovelState } from '@bookmarks/features/novel/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql/index';
import { useTitle } from 'hooks';
import { getImageUrl } from '@bookmarks/utils/image';
import CustomMarkdown from 'markdown';
import { Delete, RefreshCcw, Download, SquareArrowOutUpRight, ChevronLeft } from 'lucide-react';
import { Details } from 'details';
import { useI18n } from 'i18n';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { P, match } from 'ts-pattern';
import Chapters from './components/Chapters';
import CommentEdit from './components/CommentEdit';
import useNovelDetailItems from './useNovelDetailItems';
import { toast } from 'sonner';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'ui/components/card';
import { Skeleton } from 'ui/components/skeleton';
import { Button } from 'ui/components/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from 'ui/components/item';
import { Avatar, AvatarFallback, AvatarImage } from 'ui/components/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/components/tooltip';

const GetNovel = graphql(`
  query getNovel($id: Int!) {
    getNovel(id: $id) {
      id
      name
      avatar
      description
      createTime
      updateTime
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
      __typename
      ... on NovelSaved {
        novelId
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
      ... on MissingResources {
        resources {
          kind
          id
        }
      }
      ... on Conflict {
        reason
        resources {
          kind
          id
        }
      }
    }
  }
`);
const DeleteCommentForNovel = graphql(`
  mutation deleteCommentForNovel($novelId: Int!) {
    deleteCommentForNovel(novelId: $novelId) {
      __typename
      ... on ResourceDeleted {
        resource {
          kind
          id
        }
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
    }
  }
`);

export default function NovelDetails() {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks');
  const deletion = useBookmarkWrite('/bookmarks');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<{ id: number; name: string }>();
  // fetch data
  const { novelId } = useParams();
  const { data, loading, refetch, error } = useQuery(GetNovel, { variables: { id: Number(novelId) } });

  // title
  const t = useI18n();
  useTitle(t('novel_detail', { novelName: data?.getNovel?.name }));
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
  }, [refetch]);
  const goToSourceSite = useCallback(() => {
    if (data?.getNovel?.url) {
      window.open(data.getNovel.url, '_blank');
    }
  }, [data?.getNovel?.url]);
  const [updateNovel, { loading: updateLoading }] = useMutation(UpdateNovelByCrawler);
  const handleUpdateNovel = useCallback(async () => {
    if (
      !(await write.execute(
        async () => (await updateNovel({ variables: { novelId: Number(novelId) } })).data?.updateNovelByCrawler,
      ))
    )
      return;
    toast.success(t('update_by_crawler_success'));
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
  }, [novelId, updateNovel, refetch, t, write]);
  const items = useNovelDetailItems(data, refetch);
  const [deleteComment] = useMutation(DeleteCommentForNovel, { variables: { novelId: data?.getNovel?.id } });
  const handleDeleteComment = async () => {
    if (!target) return;
    const { id } = target;
    const confirmed = () => {
      setConfirmOpen(false);
      handleRefresh();
    };
    if (
      await deletion.execute(
        async () => (await deleteComment({ variables: { novelId: id } })).data?.deleteCommentForNovel,
        { verify: () => checkNovelState(client, id, { comment: null }), confirmed },
      )
    )
      confirmed();
  };
  return (
    <div className="flex flex-col size-full h-screen">
      <RequestNotice error={error} retry={refetch} />
      {!loading && data?.getNovel === null && !hasQueryFailure(error, ['getNovel']) && <p>{t('request_missing')}</p>}
      {write.notice}
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('delete_target', { name: `${target?.name ?? ''} · ${t('comment')}` })}
        description={t('delete_comment_impact')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        pending={deletion.pending}
        confirmDisabled={deletion.blocked}
        onConfirm={handleDeleteComment}
        notice={deletion.notice}
      />
      <div className="flex w-full p-4 pb-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label={t('back')}>
          <ChevronLeft />
        </Button>
        <div className="grow" />
        <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label={t('refresh')}>
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
                      <AvatarImage alt="" src={getImageUrl(data.getNovel.avatar)} />
                      <AvatarFallback>{data.getNovel.name[0]}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{data.getNovel.name}</ItemTitle>
                    <ItemDescription>{data.getNovel.author?.name ?? '-'}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            aria-label={t('update_by_crawler')}
                            variant="ghost"
                            size="icon"
                            disabled={write.blocked || updateLoading}
                            onClick={handleUpdateNovel}
                          />
                        }
                      >
                        <Download />
                      </TooltipTrigger>
                      <TooltipContent>{t('update_by_crawler')}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            aria-label={t('go_to_source_site')}
                            variant="ghost"
                            size="icon"
                            onClick={goToSourceSite}
                          />
                        }
                      >
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
                    {!hasQueryFailure(error, ['getNovel', 'comments']) && (
                      <CommentEdit
                        disabled={deletion.blocked}
                        refetch={refetch}
                        novelId={data.getNovel.id}
                        mode={match(data.getNovel.comments?.content)
                          .with(P.nonNullable, () => 'update' as const)
                          .otherwise(() => 'create' as const)}
                        initContent={data.getNovel.comments?.content}
                      />
                    )}
                    {data.getNovel.comments?.content && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              aria-label={t('delete')}
                              variant="ghost"
                              size="icon"
                              disabled={deletion.pending}
                              onClick={() => {
                                if (!deletion.blocked && data.getNovel)
                                  setTarget({ id: data.getNovel.id, name: data.getNovel.name });
                                setConfirmOpen(true);
                              }}
                            />
                          }
                        >
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
              {data.getNovel.chapters && (
                <Chapters chapters={data.getNovel.chapters} refetch={refetch} novelId={data.getNovel.id} />
              )}
            </>
          )}
          {loading && (
            <Card>
              <CardContent className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-col gap-2">
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
