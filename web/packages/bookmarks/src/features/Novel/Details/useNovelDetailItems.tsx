import { useMutation } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import type { DetailsItem } from 'details';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
      id
    }
  }
`);
export default function useNovelDetailItems(data: GetNovelQuery | undefined, refetch: () => void) {
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
                value: (
                  <Button variant="link" className="text-foreground w-fit px-0 text-left" asChild>
                    <Link to={`/bookmarks/authors/${data.author.id}`}>{data.author.name}</Link>
                  </Button>
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
                      {data.tags.map((tag) => (
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
                    {data.collections.map(({ id, name, path }) => (
                      <Tooltip key={id}>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary">
                            <Link to={`/bookmarks/collections?parentId=${id}`}>{name}</Link>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="data-[state=open]:bg-muted size-6 rounded-full"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteCollectionForNovel({ variables: { collectionId: id, novelId: data.id } });
                                refetch();
                              }}
                            >
                              <X />
                            </Button>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{path}</TooltipContent>
                      </Tooltip>
                    ))}
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
    [data, t, deleteCollectionForNovel, refetch],
  );
  return items;
}
