/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-01 17:53:40
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 19:56:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/index.tsx
 */
import { type FetchAuthorQueryVariables, NovelSite } from '@bookmarks/gql/graphql';
import { Controller, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { getImageUrl } from '@bookmarks/utils/image';
import ChapterModal from '@bookmarks/components/ChapterModal';
import { convertFetchToDraftAuthor } from './utils';
import useTitle from '@bookmarks/hooks/useTitle';
import { graphql } from '@bookmarks/gql';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { toast } from 'sonner';
import { Button } from '@portal/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@portal/components/ui/card';
import { FieldError, FieldGroup, FieldLegend, FieldSet } from '@portal/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portal/components/ui/select';
import { Save, Search } from 'lucide-react';
import { Input } from '@portal/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@portal/components/ui/item';
import { Avatar, AvatarFallback, AvatarImage } from '@portal/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { Skeleton } from '@portal/components/ui/skeleton';
import { Spinner } from '@portal/components/ui/spinner';
import { match } from 'ts-pattern';

const FetchAuthor = graphql(`
  query fetchAuthor($id: String!, $novelSite: NovelSite!) {
    fetchAuthor(id: $id, novelSite: $novelSite) {
      __typename
      name
      description
      image
      url
      id
      site
      novels {
        id
        name
        description
        image
        url
        status
        site
        chapters {
          id
          novelId
          title
          url
          time
          wordCount
          site
        }
        tags {
          id
          name
          url
        }
      }
    }
  }
`);

const SaveDraftAuthor = graphql(`
  mutation saveDraftAuthor($author: SaveDraftAuthor!) {
    saveDraftAuthor(author: $author) {
      id
    }
  }
`);

export default function AuthorFetch() {
  // title
  const t = useI18n();
  useTitle(t('author_crawler'));

  // fetch
  type FormData = FetchAuthorQueryVariables;
  const [fn, { data, loading }] = useLazyQuery(FetchAuthor);
  const { handleSubmit, register, control } = useForm<FormData>();
  const onSubmit = handleSubmit((data) => {
    fn({ variables: data });
  });
  const author = data?.fetchAuthor;

  // save
  const [saveDraftAuthor, { loading: saveLoading }] = useMutation(SaveDraftAuthor);
  return (
    <form className="flex flex-col size-full p-4 gap-4" onSubmit={onSubmit}>
      <Card className="gap-0">
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
          <CardAction>
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
                  disabled={!author || saveLoading}
                  onClick={async () => {
                    if (author) {
                      await saveDraftAuthor({ variables: { author: convertFetchToDraftAuthor(author) } });
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
      {author && !loading && (
        <Card className="flex-[1_1_0] overflow-y-auto">
          <Item className="pt-0 px-6">
            <ItemMedia>
              <Avatar className="size-10">
                <AvatarImage src={getImageUrl(author.image)} />
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
    </form>
  );
}
