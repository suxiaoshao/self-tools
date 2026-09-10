import { PageToolbar } from 'ui/page-toolbar';
import { useId } from 'react';
import { RequestNotice } from 'custom-graphql';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import type { FetchAuthorQueryVariables } from '@bookmarks/gql/graphql';
import { Controller, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { getImageUrl } from '@bookmarks/utils/image';
import ChapterModal from '@bookmarks/components/ChapterModal/index';
import { convertFetchToDraftAuthor } from './utils';
import { FetchAuthorDocument as FetchAuthor, SaveDraftAuthorDocument as SaveDraftAuthor } from '@bookmarks/gql/graphql';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { toast } from 'ui/components/toast';
import { Button } from 'ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from 'ui/components/card';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui/components/select';
import { Save, Search } from 'lucide-react';
import { Input } from 'ui/components/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from 'ui/components/item';
import { Avatar, AvatarFallback, AvatarImage } from 'ui/components/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/components/tooltip';
import { Skeleton } from 'ui/components/skeleton';
import { Spinner } from 'ui/components/spinner';
import { match } from 'ts-pattern';

export default function AuthorFetch() {
  const write = useBookmarkWrite('/bookmarks/authors');
  const formId = useId();
  // title
  const t = useI18n();
  const sites = { JJWXC: t('jjwxc'), QIDIAN: t('qidian') };

  // fetch
  type FormData = FetchAuthorQueryVariables;
  const [fn, { data, loading, error }] = useLazyQuery(FetchAuthor);
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit = handleSubmit((data) => {
    void fn({ variables: data }).catch(() => undefined);
  });
  const author = data?.fetchAuthor;

  // save
  const [saveDraftAuthor, { loading: saveLoading }] = useMutation(SaveDraftAuthor);
  return (
    <form noValidate className="flex min-h-0 size-full flex-col" onSubmit={onSubmit}>
      <title>{t('author_crawler')}</title>
      <PageToolbar>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" type="submit" disabled={loading} aria-label={t('fetch')} />}
          >
            <Search />
          </TooltipTrigger>
          <TooltipContent>{t('fetch')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                aria-label={t('save_draft')}
                variant="ghost"
                size="icon"
                disabled={write.blocked || !author || saveLoading}
                onClick={async () => {
                  if (author) {
                    if (
                      !(await write.execute(
                        async () =>
                          (await saveDraftAuthor({ variables: { author: convertFetchToDraftAuthor(author) } })).data
                            ?.saveDraftAuthor,
                      ))
                    )
                      return;
                    toast.add({ title: t('save_draft_success'), type: 'success' });
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
      </PageToolbar>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <RequestNotice error={error} />
        {write.notice}
        <Card className="shrink-0 gap-0">
          <CardHeader>
            <CardTitle>{t('filter')}</CardTitle>
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
                <FieldLabel htmlFor={`${formId}-id`}>{t('author_id')}</FieldLabel>
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
          <Card className="shrink-0">
            <CardContent className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </CardContent>
          </Card>
        )}
        {author && !loading && (
          <Card className="shrink-0">
            <Item className="pt-0 px-6">
              <ItemMedia>
                <Avatar className="size-10">
                  <AvatarImage alt="" src={getImageUrl(author.image)} />
                  <AvatarFallback>{author.name[0]}</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{author.name}</ItemTitle>
                <ItemDescription>{author.description}</ItemDescription>
              </ItemContent>
            </Item>
            <ItemGroup>
              {author.novels.map((novel) => (
                <Item key={novel.url}>
                  <ItemMedia variant="image">
                    <img className="size-8 object-cover grayscale" src={getImageUrl(novel.image)} alt={novel.name} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{novel.name}</ItemTitle>
                    <ItemDescription>{novel.description}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChapterModal chapters={novel.chapters} />
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </Card>
        )}
      </div>
    </form>
  );
}
