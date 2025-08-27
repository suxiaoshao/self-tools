/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-01 17:53:40
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:56:05
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/index.tsx
 */
import useTitle from '@bookmarks/hooks/useTitle';
import { getImageUrl } from '@bookmarks/utils/image';
import { Search, Save } from '@mui/icons-material';
import {
  Avatar,
  Backdrop,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
} from '@mui/material';
import { useI18n } from 'i18n';
import { Controller, useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notify';
import { convertFetchToDraftNovel } from './utils';
import { format } from 'time';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  useCustomTable,
} from 'custom-table';
import { useMemo } from 'react';
import { Details, type DetailsItem } from 'details';
import { match, P } from 'ts-pattern';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { graphql } from '@bookmarks/gql';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { type FetchNovelQuery, type FetchNovelQueryVariables, NovelSite } from '@bookmarks/gql/graphql';

const FetchNovel = graphql(`
  query fetchNovel($id: String!, $novelSite: NovelSite!) {
    fetchNovel(id: $id, novelSite: $novelSite) {
      author {
        description
        image
        name
        url
        id
      }
      chapters {
        title
        url
        site
        time
        wordCount
        id
      }
      tags {
        id
        name
        url
      }
      description
      image
      name
      url
      site
      status
      id
    }
  }
`);

const SaveDraftNovel = graphql(`
  mutation saveDraftNovel($novel: SaveDraftNovel!) {
    saveDraftNovel(novel: $novel) {
      id
    }
  }
`);

type ChapterData = FetchNovelQuery['fetchNovel']['chapters'][number];
const columnHelper = createCustomColumnHelper<ChapterData>();

export default function NovelFetch() {
  // title
  const t = useI18n();
  useTitle(t('novel_crawler'));

  // fetch
  type FormData = FetchNovelQueryVariables;
  const [fn, { data, loading }] = useLazyQuery(FetchNovel);
  const { handleSubmit, register, control } = useForm<FormData>();
  const onSubmit = handleSubmit((data) => {
    fn({ variables: data });
  });
  const novel = data?.fetchNovel;

  // save
  const [saveDraftNovel, { loading: saveLoading }] = useMutation(SaveDraftNovel);

  // chapters table
  const columns = useMemo<CustomColumnDefArray<ChapterData>>(
    () =>
      [
        columnHelper.accessor('title', { header: t('title'), id: 'title', cell: (context) => context.getValue() }),
        columnHelper.accessor('wordCount', {
          header: t('word_count'),
          id: 'wordCount',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ time }) => format(time), {
          header: t('time'),
          id: 'time',
          cell: (context) => context.getValue(),
        }),
      ] as CustomColumnDefArray<ChapterData>,
    [t],
  );
  const tableOptions = useMemo<CustomTableOptions<ChapterData>>(
    () => ({ columns, data: novel?.chapters ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, novel?.chapters],
  );
  const tableInstance = useCustomTable(tableOptions);

  // details
  const items = useMemo<DetailsItem[]>(
    () =>
      match(novel)
        .with(
          P.nonNullable,
          (data) =>
            [
              {
                label: t('author'),
                value: data.author.name,
              },
              {
                label: t('novel_status'),
                value: t(getLabelKeyByNovelStatus(data.status)),
              },
              {
                label: t('novel_site'),
                value: t(getLabelKeyBySite(data.site)),
              },
              {
                label: t('last_update_time'),
                value: match(data.chapters.at(-1)?.time)
                  .with(P.string, (data) => format(data as string))
                  .otherwise(() => '-'),
              },
              {
                label: t('first_chapter_time'),
                value: match(data.chapters.at(0)?.time)
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
                label: t('description'),
                value: data.description,
                span: 3,
              },
            ] satisfies DetailsItem[],
        )
        .otherwise(() => []),
    [novel, t],
  );
  return (
    <Box
      onSubmit={onSubmit}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2, gap: 2 }}
      component="form"
    >
      <Card>
        <CardHeader
          title={t('filter')}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('fetch')}>
                <IconButton type="submit">
                  <Search />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('save_draft')}>
                <IconButton
                  disabled={!novel || saveLoading}
                  onClick={async () => {
                    if (novel) {
                      await saveDraftNovel({ variables: { novel: convertFetchToDraftNovel(novel) } });
                      enqueueSnackbar(t('save_draft_success'), { variant: 'success' });
                    }
                  }}
                >
                  <Save />
                </IconButton>
              </Tooltip>
              <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={saveLoading}>
                <CircularProgress color="inherit" />
              </Backdrop>
            </Box>
          }
        />
        <CardContent sx={{ display: 'flex', gap: 1 }}>
          <Controller
            control={control}
            name="novelSite"
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <TextField
                error={!!fieldState?.error?.message}
                helperText={fieldState?.error?.message}
                select
                label={t('novel_site')}
                required
                fullWidth
                {...field}
              >
                <MenuItem value={NovelSite.Jjwxc}>{t('jjwxc')}</MenuItem>
                <MenuItem value={NovelSite.Qidian}>{t('qidian')}</MenuItem>
              </TextField>
            )}
          />
          <TextField required fullWidth label={t('novel_id')} {...register('id', { required: true })} />
        </CardContent>
      </Card>
      {loading && (
        <Card>
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="rectangular" width={210} height={60} />
          <Skeleton variant="rounded" width={210} height={60} />
        </Card>
      )}
      {novel && !loading && (
        <>
          <Card>
            <CardHeader
              avatar={<Avatar src={getImageUrl(novel.image)} />}
              title={novel.name}
              subheader={novel.author.name}
            />
            <CardContent>
              <Details items={items} />
            </CardContent>
          </Card>
          <CustomTable tableInstance={tableInstance} />
        </>
      )}
    </Box>
  );
}
