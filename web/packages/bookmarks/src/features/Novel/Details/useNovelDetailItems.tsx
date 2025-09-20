import { useMutation } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import { Box, Chip, Link } from '@mui/material';
import type { DetailsItem } from 'details';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { format } from 'time';
import { match, P } from 'ts-pattern';
import AddCollection from './components/AddCollection';

const DeleteCollectionForNovel = graphql(`
  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {
    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {
      id
    }
  }
`);
export default function useNovelDetailItems(data: GetNovelQuery | undefined, refetch: () => void) {
  const [deleteCollectionForNovel] = useMutation(DeleteCollectionForNovel);
  const navigate = useNavigate();

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
                  <Link to={`/bookmarks/authors/${data.author.id}`} component={RouterLink}>
                    {data.author.name}
                  </Link>
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
                span: 2,
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
    [data, t, deleteCollectionForNovel, navigate, refetch],
  );
  return items;
}
