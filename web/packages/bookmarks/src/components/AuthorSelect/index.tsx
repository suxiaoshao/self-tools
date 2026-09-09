import { RequestNotice } from 'custom-graphql';
/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-01 00:31:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/AuthorSelect/index.tsx
 */
import { useI18n } from 'i18n';
import { type ComponentProps, useMemo } from 'react';
import { getImageUrl } from '@bookmarks/utils/image';
import { graphql } from '@bookmarks/gql/index';
import { useQuery } from '@apollo/client/react';
import { match } from 'ts-pattern';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from 'ui/components/combobox';
import { Avatar, AvatarFallback, AvatarImage } from 'ui/components/avatar';

const SearchAuthor = graphql(`
  query searchAuthor($searchName: String) {
    # todo 取消分页或者选择器支持分页
    allAuthors(searchName: $searchName) {
      id
      name
      description
      avatar
    }
  }
`);

interface TagsSelectProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value'> {
  onChange: (value: number) => void;
  value: number | null | undefined;
}

export default function AuthorSelect({ onChange, className, value, disabled, ...props }: TagsSelectProps) {
  const { error, loading, data: { allAuthors } = {} } = useQuery(SearchAuthor);
  const authors = allAuthors ?? [];
  const t = useI18n();
  const selectedAuthor = useMemo(() => {
    if (!value || !allAuthors) return null;
    return allAuthors.find((author) => author.id === value) ?? null;
  }, [value, allAuthors]);
  const anchor = useComboboxAnchor();

  return (
    <>
      <RequestNotice error={error} />
      <Combobox<(typeof authors)[number]>
        disabled={disabled || !!error}
        items={authors}
        itemToStringLabel={(item) => item.name}
        value={selectedAuthor ?? null}
        onValueChange={(selectedAuthorItem) => {
          if (selectedAuthorItem) {
            onChange(selectedAuthorItem.id);
          }
        }}
      >
        <ComboboxInput disabled={disabled || !!error} placeholder={t('search')} className={className} {...props} />
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>
            {match(loading)
              .with(true, () => t('loading'))
              .otherwise(() => t('no_author_found'))}
          </ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                <Avatar className="size-5">
                  <AvatarImage alt="" src={getImageUrl(item.avatar)} />
                  <AvatarFallback aria-hidden="true">{item.name[0]}</AvatarFallback>
                </Avatar>
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  );
}
