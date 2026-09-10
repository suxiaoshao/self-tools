import { useId } from 'react';
import { RequestNotice } from 'custom-graphql';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useTitle } from 'hooks';
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
} from 'custom-table';
import { useMemo } from 'react';
import { Details, type DetailsItem } from 'details';
import { match, P } from 'ts-pattern';
import { getLabelKeyByNovelStatus } from '@bookmarks/utils/novelStatus';
import { getLabelKeyBySite } from '@bookmarks/utils/novelSite';
import { graphql } from '@bookmarks/gql/index';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import type { FetchNovelQuery, FetchNovelQueryVariables } from '@bookmarks/gql/graphql';
import { toast } from 'sonner';
import { Button } from 'ui/components/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'ui/components/card';
import { Skeleton } from 'ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/components/tooltip';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui/components/select';
import { Input } from 'ui/components/input';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from 'ui/components/item';
import { Avatar, AvatarFallback, AvatarImage } from 'ui/components/avatar';
import { Badge } from 'ui/components/badge';
import { Spinner } from 'ui/components/spinner';

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

type ChapterData = FetchNovelQuery['fetchNovel']['chapters'][number];
const columnHelper = createCustomColumnHelper<ChapterData>();

export default function NovelFetch() {
  const write = useBookmarkWrite('/bookmarks');
  const t = useI18n();
  const sites = { JJWXC: t('jjwxc'), QIDIAN: t('qidian') };
  useTitle(t('novel_crawler'));
  const formId = useId();
  // fetch
  type FormData = FetchNovelQueryVariables;
  const [fn, { data, loading, error }] = useLazyQuery(FetchNovel);
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit = handleSubmit((data) => {
    void fn({ variables: data }).catch(() => undefined);
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
    <form noValidate className="flex flex-col size-full p-4 gap-4" onSubmit={onSubmit}>
      <RequestNotice error={error} />
      {write.notice}
      <Card>
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
          <CardAction>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon" type="submit" disabled={loading} aria-label={t('fetch')} />
                  }
                >
                  <Search />
                </TooltipTrigger>
                <TooltipContent>{t('fetch')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      aria-label={t('save_draft')}
                      variant="ghost"
                      size="icon"
                      disabled={write.blocked || !novel || saveLoading}
                      onClick={async () => {
                        if (novel) {
                          if (
                            !(await write.execute(
                              async () =>
                                (await saveDraftNovel({ variables: { novel: convertFetchToDraftNovel(novel) } })).data
                                  ?.saveDraftNovel,
                            ))
                          )
                            return;
                          toast.success(t('save_draft_success'));
                        }
                      }}
                    />
                  }
                >
                  {match(saveLoading)
                    .with(true, () => <Spinner />)
                    .otherwise(() => (
                      <Save />
                    ))}
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
              rules={{ required: t('request_required') }}
              render={({ field: { onChange, ref, ...field }, fieldState }) => (
                <Field className="flex-1" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-site`}>{t('novel_site')}</FieldLabel>
                  <Select required {...field} value={field.value ?? null} items={sites} onValueChange={onChange}>
                    <SelectTrigger
                      ref={ref}
                      id={`${formId}-site`}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? `${formId}-site-error` : undefined}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.entries(sites).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError
                      id={`${formId}-site-error`}
                      errors={[
                        fieldState.error && {
                          ...fieldState.error,
                          message:
                            fieldState.error?.type === 'required' ? t('request_required') : fieldState.error.message,
                        },
                      ]}
                    />
                  )}
                </Field>
              )}
            />
            <Field className="flex-1" data-invalid={!!errors.id}>
              <FieldLabel htmlFor={`${formId}-id`}>{t('novel_id')}</FieldLabel>
              <Input
                id={`${formId}-id`}
                aria-describedby={errors.id ? `${formId}-id-error` : undefined}
                aria-invalid={!!errors.id}
                required
                {...register('id', { required: t('request_required') })}
              />

              <FieldError
                id={`${formId}-id-error`}
                errors={[
                  errors.id && {
                    ...errors.id,
                    message: errors.id?.type === 'required' ? t('request_required') : errors.id.message,
                  },
                ]}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      {loading && (
        <Card>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-62.5" />
              <Skeleton className="h-4 w-50" />
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
                  <AvatarImage alt="" src={getImageUrl(novel.image)} />
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
          <CustomTable options={tableOptions} />
        </>
      )}
    </form>
  );
}
