import { Refresh } from '@mui/icons-material';
import { Avatar, Box, FormControl, FormLabel, IconButton, Link, Paper, Switch } from '@mui/material';
import {
  createCustomColumnHelper,
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableOptions,
  getCoreRowModel,
  TableActions,
  useCustomTable,
} from 'custom-table';
import { useI18n } from 'i18n';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'time';
import {
  type GetNovelsQuery,
  type GetNovelsQueryVariables,
  useDeleteNovelMutation,
  useGetNovelsQuery,
} from '../../../graphql';
import CreateNovelButton from './Components/CreateNovelButton';
import { convertFormToVariables } from './utils';
import { getImageUrl } from '@bookmarks/utils/image';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import CollectionMultiSelect from '@bookmarks/components/CollectionMultiSelect';
import TagsSelect from '@bookmarks/components/TagsSelect';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';

type Data = GetNovelsQuery['queryNovels'][0];

const columnHelper = createCustomColumnHelper<Data>();

export default function NovelList() {
  type FormData = GetNovelsQueryVariables;
  const { control, watch, register } = useForm<FormData>({ defaultValues: { tagMatch: { matchSet: [] } } });
  const form = watch();
  const { data, refetch } = useGetNovelsQuery({ variables: convertFormToVariables(form) });
  const [deleteNovel] = useDeleteNovelMutation();
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
        columnHelper.accessor(
          ({ id, name }) => (
            <Link to={`/bookmarks/novel/${id}`} underline="hover" component={RouterLink}>
              {name}
            </Link>
          ),
          {
            header: t('name'),
            id: 'name',
            cell: (context) => context.getValue(),
          },
        ),
        columnHelper.accessor(({ site }) => t(getLabelKeyBySite(site)), {
          header: t('novel_site'),
          id: 'site',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ avatar }) => <Avatar src={getImageUrl(avatar)} />, {
          header: t('avatar'),
          id: 'avatar',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ novelStatus }) => t(getLabelKeyByNovelStatus(novelStatus)), {
          header: t('novel_status'),
          id: 'status',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ description }) => description ?? '-', {
          header: t('description'),
          id: 'description',
          cellProps: {
            align: 'center',
            sx: {
              maxWidth: 700,
            },
          },
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ createTime }) => format(createTime), {
          header: t('create_time'),
          id: 'createTime',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(({ updateTime }) => format(updateTime), {
          header: t('update_time'),
          id: 'updateTime',
          cell: (context) => context.getValue(),
        }),
        columnHelper.accessor(
          ({ id }) => (
            <TableActions>
              {(onClose) => [
                {
                  text: t('delete'),
                  onClick: async () => {
                    await deleteNovel({ variables: { id } });
                    onClose();
                    await refetch();
                  },
                },
              ]}
            </TableActions>
          ),
          {
            header: t('actions'),
            id: 'action',
            cell: (context) => context.getValue(),
          },
        ),
      ] as CustomColumnDefArray<Data>,
    [deleteNovel, refetch, t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: data?.queryNovels ?? [], getCoreRowModel: getCoreRowModel() }),
    [columns, data?.queryNovels],
  );
  const tableInstance = useCustomTable(tableOptions);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box
        sx={{
          flex: '0 0 auto',
          display: 'flex',
          p: 2,
          pb: 0,
        }}
      >
        <CreateNovelButton refetch={refetch} />
        <IconButton sx={{ marginLeft: 'auto' }} onClick={() => refetch()}>
          <Refresh />
        </IconButton>
      </Box>
      <Box sx={{ flex: '1 1 0', overflowY: 'auto', p: 2, pr: 1 }}>
        <Paper
          sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', p: 1, marginBottom: 2, rowGap: 1, columnGap: 2 }}
        >
          <FormControl>
            <FormLabel id="collection-full-match">{t('collection_whether_full_match')}</FormLabel>
            <Switch aria-labelledby="collection-full-match" {...register('collectionMatch.fullMatch')} />
          </FormControl>

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">{t('match_collections')} </FormLabel>
            <Controller
              control={control}
              name="collectionMatch.matchSet"
              render={({ field }) => <CollectionMultiSelect {...field} />}
            />
          </FormControl>
          <FormControl>
            <FormLabel id="tag-full-match">{t('tag_whether_full_match')}</FormLabel>
            <Switch aria-labelledby="tag-full-match" {...register('tagMatch.fullMatch')} />
          </FormControl>

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">{t('match_tags')}</FormLabel>
            <Controller control={control} name="tagMatch.matchSet" render={({ field }) => <TagsSelect {...field} />} />
          </FormControl>
        </Paper>
        <CustomTable
          sx={{
            overflowY: 'hidden',
            flex: undefined,
            maxHeight: undefined,
          }}
          tableInstance={tableInstance}
        />
      </Box>
    </Box>
  );
}
