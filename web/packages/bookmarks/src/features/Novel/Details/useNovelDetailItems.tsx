import { checkNovelState } from '@bookmarks/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useMutation } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import type { DetailsItem } from 'details';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { format } from 'time';
import { match, P } from 'ts-pattern';
import AddCollection from './components/AddCollection';
import { Button } from '@portal/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { Badge } from '@portal/components/ui/badge';
import { X } from 'lucide-react';

const DeleteCollectionForNovel = graphql(`
  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {
    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {
      __typename
      ... on CollectionMembershipChanged {
        collectionId
        resource {
          kind
          id
        }
        present
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
export default function useNovelDetailItems(data: GetNovelQuery | undefined, refetch: () => void) {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks/novel');
  const [deleteCollectionForNovel] = useMutation(DeleteCollectionForNovel);

  const t = useI18n();
  const items = useMemo<DetailsItem[]>(
    () =>
      match(data?.getNovel)
        .with(
          P.nonNullable,
          (data) =>
            [
              {
                label: t('author'),
                value: data.author ? (
                  <Button variant="link" className="text-foreground w-fit px-0 text-left">
                    <Link to={`/bookmarks/authors/${data.author.id}`}>{data.author.name}</Link>
                  </Button>
                ) : (
                  '-'
                ),
              },
              {
                label: t('novel_status'),
                value: t(getLabelKeyByNovelStatus(data.novelStatus)),
              },
              {
                label: t('novel_site'),
                value: t(getLabelKeyBySite(data.site)),
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
                    <div className="flex gap-2">
                      {data.tags?.map((tag) => (
                        <Badge
                          className="cursor-pointer"
                          variant="secondary"
                          onClick={() => {
                            window.open(tag.url, '_blank');
                          }}
                          key={tag.id}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )),
                span: 2,
              },
              {
                label: t('collections'),
                value: (
                  <div className="flex gap-2">
                    {data.collections?.map(({ id, name, path }) => (
                      <Tooltip key={id}>
                        <TooltipTrigger render={<Badge variant="secondary" />}>
                          <Link to={`/bookmarks/collections?parentId=${id}`}>{name}</Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="data-[state=open]:bg-muted size-6 rounded-full"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (
                                !(await write.execute(
                                  async () =>
                                    (
                                      await deleteCollectionForNovel({
                                        variables: { collectionId: id, novelId: data.id },
                                      })
                                    ).data?.deleteCollectionForNovel,
                                  {
                                    verify: () =>
                                      checkNovelState(client, data.id, { collectionId: id, present: false }),
                                    confirmed: refetch,
                                  },
                                ))
                              )
                                return;
                              void Promise.resolve()
                                .then(() => refetch())
                                .catch(() => undefined);
                            }}
                          >
                            <X />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{path}</TooltipContent>
                      </Tooltip>
                    ))}
                    {write.notice}
                    <AddCollection novelId={data.id} refetch={refetch} />
                  </div>
                ),
                span: 4,
              },
              {
                label: t('description'),
                value: data.description,
                span: 4,
              },
            ] satisfies DetailsItem[],
        )
        .otherwise(() => []),
    [data, t, deleteCollectionForNovel, refetch, write, client],
  );
  return items;
}
