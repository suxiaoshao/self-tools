/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-01 17:53:40
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:56:05
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/index.tsx
 */
import useTitle from '@bookmarks/hooks/useTitle';
import { getImageUrl } from '@bookmarks/utils/image';
import { Search, Save } from 'lucide-react';
import { useI18n } from 'i18n';
import { Controller, useForm } from 'react-hook-form';
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
import { toast } from 'sonner';
import { Button } from '@portal/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@portal/components/ui/card';
import { Skeleton } from '@portal/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { FieldError, FieldGroup, FieldLegend, FieldSet } from '@portal/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portal/components/ui/select';
import { Input } from '@portal/components/ui/input';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@portal/components/ui/item';
import { Avatar, AvatarFallback, AvatarImage } from '@portal/components/ui/avatar';
import { Badge } from '@portal/components/ui/badge';
import { Spinner } from '@portal/components/ui/spinner';

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
  const [saveDraftNovel, { loading: saveLoading }] = useMutation(SaveDraftNovel);
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
    <form className="flex flex-col size-full p-4 gap-4" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
          <CardAction>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" type="submit">
                    <Search />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('fetch')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!novel || saveLoading}
                    onClick={async () => {
                      if (novel) {
                        await saveDraftNovel({ variables: { novel: convertFetchToDraftNovel(novel) } });
                        toast.success(t('save_draft_success'));
                      }
                    }}
                  >
                    {match(saveLoading)
                      .with(true, () => <Spinner />)
                      .otherwise(() => (
                        <Save />
                      ))}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('save_draft')}</TooltipContent>
              </Tooltip>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="flex flex-row">
            <Controller
              control={control}
              name="novelSite"
              rules={{ required: true }}
              render={({ field: { onChange, ...field }, fieldState }) => (
                <FieldSet className="flex-1">
                  <FieldLegend>{t('novel_site')}</FieldLegend>
                  <Select required {...field} onValueChange={onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={NovelSite.Jjwxc}>{t('jjwxc')}</SelectItem>
                        <SelectItem value={NovelSite.Qidian}>{t('qidian')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldSet>
              )}
            />
            <FieldSet className="flex-1">
              <FieldLegend>{t('author_id')}</FieldLegend>
              <Input required {...register('id', { required: true })} />
            </FieldSet>
          </FieldGroup>
        </CardContent>
      </Card>
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
      {novel && !loading && (
        <>
          <Card>
            <Item className="pt-0 px-6">
              <ItemMedia>
                <Avatar className="size-10">
                  <AvatarImage src={getImageUrl(novel.image)} />
                  <AvatarFallback>{novel.name[0]}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{novel.name}</ItemTitle>
                <ItemDescription>{novel.author.name}</ItemDescription>
              </ItemContent>
            </Item>
            <CardContent>
              <Details items={items} />
            </CardContent>
          </Card>
          <CustomTable tableInstance={tableInstance} />
        </>
      )}
    </form>
  );
}
