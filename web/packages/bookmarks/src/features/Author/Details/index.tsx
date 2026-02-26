/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-29 06:28:45
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-29 07:10:10
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Details/index.tsx
 */
import { useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import { NovelStatus } from '@bookmarks/gql/graphql';
import useTitle from '@bookmarks/hooks/useTitle';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@portal/components/ui/avatar';
import { Badge } from '@portal/components/ui/badge';
import { Button } from '@portal/components/ui/button';
import { Card, CardContent } from '@portal/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@portal/components/ui/item';
import { Skeleton } from '@portal/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { Details, type DetailsItem } from 'details';
import { useI18n } from 'i18n';
import {
  ChevronLeft,
  CircleCheck,
  CirclePause,
  Download,
  Loader,
  RefreshCcw,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'time';
import { P, match } from 'ts-pattern';

const GetAuthor = graphql(`
  query getAuthor($id: Int!) {
    getAuthor(id: $id) {
      novels {
        id
        name
        avatar
        createTime
        updateTime
        description
        novelStatus
        url
        lastChapter {
          time
        }
        firstChapter {
          time
        }
        wordCount
      }
      id
      site
      name
      createTime
      updateTime
      avatar
      description
      url
    }
  }
`);

const UpdateAuthor = graphql(`
  mutation updateAuthorByCrawler($authorId: Int!) {
    updateAuthorByCrawler(authorId: $authorId) {
      id
    }
  }
`);

export default function AuthorDetails() {
  const t = useI18n();
  const { authorId } = useParams();
  const { data, loading, refetch } = useQuery(GetAuthor, { variables: { id: Number(authorId) } });
  useTitle(t('author_detail', { authorName: data?.getAuthor?.name }));
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const goToSourceSite = useCallback(() => {
    if (data?.getAuthor?.url) {
      window.open(data.getAuthor.url, '_blank');
    }
  }, [data?.getAuthor?.url]);
  const [updateAuthor, { loading: updateLoading }] = useMutation(UpdateAuthor);
  const handleUpdateAuthor = useCallback(async () => {
    await updateAuthor({ variables: { authorId: Number(authorId) } });
    toast.success(t('update_by_crawler_success'));
    refetch();
  }, [authorId, refetch, updateAuthor, t]);
  return (
    <div className="flex flex-col size-full p-4 gap-2 pb-0 pt-2">
      <div className="flex w-full">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <div className="grow" />
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCcw />
        </Button>
      </div>
      {data?.getAuthor && (
        <>
          <Card>
            <Item className="pt-0 px-6">
              <ItemMedia>
                <Avatar className="size-10">
                  <AvatarImage src={getImageUrl(data.getAuthor.avatar)} />
                  <AvatarFallback>{data.getAuthor.name[0]}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{data.getAuthor.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon" disabled={updateLoading} onClick={handleUpdateAuthor} />
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
            <CardContent>{data.getAuthor.description}</CardContent>
          </Card>
          <div className="flex-[1_1_0] overflow-y-auto grid gap-4 pb-4 grid-cols-[repeat(auto-fill,minmax(--spacing(80),1fr))] grid-rows-[masonry] auto-rows-max items-start display-[masonry]">
            {data?.getAuthor.novels.map(
              ({ id, avatar, name, description, url, novelStatus, wordCount, lastChapter, firstChapter }) => (
                <Card key={id}>
                  <Item className="pt-0 px-6">
                    <ItemMedia>
                      <Avatar className="size-10">
                        <AvatarImage src={getImageUrl(avatar)} />
                        <AvatarFallback>{name[0]}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        <Link className="text-primary underline-offset-4 hover:underline" to={`/bookmarks/novel/${id}`}>
                          {name}
                        </Link>
                      </ItemTitle>
                      <ItemDescription>
                        {match(novelStatus)
                          .with(NovelStatus.Ongoing, () => (
                            <Badge variant="outline" className="text-muted-foreground px-1.5">
                              <Loader className="fill-yellow-500 dark:fill-yellow-400" />
                              {t('ongoing')}
                            </Badge>
                          ))
                          .with(NovelStatus.Completed, () => (
                            <Badge variant="outline" className="text-muted-foreground px-1.5">
                              <CircleCheck className="fill-green-500 dark:fill-green-400" />
                              {t('completed')}
                            </Badge>
                          ))
                          .with(NovelStatus.Paused, () => (
                            <Badge variant="outline" className="text-muted-foreground px-1.5">
                              <CirclePause className="fill-red-500 dark:fill-red-400" />
                              {t('paused')}
                            </Badge>
                          ))
                          .exhaustive()}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Tooltip>
                        <TooltipTrigger
                          render={<Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank')} />}
                        >
                          <SquareArrowOutUpRight />
                        </TooltipTrigger>
                        <TooltipContent>{t('go_to_source_site')}</TooltipContent>
                      </Tooltip>
                    </ItemActions>
                  </Item>
                  <CardContent className="flex flex-col gap-2">
                    <p>{description}</p>
                    <Details
                      fullSpan={2}
                      items={
                        [
                          {
                            label: t('novel_status'),
                            value: t(getLabelKeyByNovelStatus(novelStatus)),
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
          </div>
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
  );
}
