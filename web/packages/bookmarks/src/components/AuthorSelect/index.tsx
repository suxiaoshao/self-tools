/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-05-01 00:31:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/AuthorSelect/index.tsx
 */
import { useI18n } from 'i18n';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import { debounceTime, Subject } from 'rxjs';
import { getImageUrl } from '@bookmarks/utils/image';
import { graphql } from '@bookmarks/gql';
import { useQuery } from '@apollo/client/react';
import { Popover, PopoverContent, PopoverTrigger } from '@portal/components/ui/popover';
import { cn } from '@portal/lib/utils';
import { Button } from '@portal/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { match, P } from 'ts-pattern';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@portal/components/ui/command';
import useDialog from '@collections/hooks/useDialog';
import { Avatar, AvatarImage } from '@portal/components/ui/avatar';

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

export interface TagsSelectProps extends Omit<ComponentProps<'button'>, 'name' | 'onChange' | 'value'> {
  onChange: (value: number) => void;
  value: number | null | undefined;
}

export default function AuthorSelect({ onChange, className, value, ...props }: TagsSelectProps) {
  const [searchName, setSearchName] = useState('');

  const { loading, data: { allAuthors } = {} } = useQuery(SearchAuthor, {
    variables: { searchName },
  });
  const event = useMemo(() => new Subject<string>(), []);
  useEffect(() => {
    const key = event.pipe(debounceTime(300)).subscribe((value) => {
      setSearchName(value);
    });
    return () => {
      key.unsubscribe();
    };
  }, [event]);
  const t = useI18n();
  const selectedAuthor = useMemo(() => {
    if (!value) return null;
    return allAuthors?.find((author) => author.id === value);
  }, [value, allAuthors]);
  const { open, handleClose, handleOpenChange } = useDialog();
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          // oxlint-disable-next-line role-has-required-aria-props
          role="combobox"
          className={cn('justify-between items-center', className)}
          {...props}
        >
          {match(selectedAuthor)
            .with(P.nonNullable, ({ name }) => name)
            .otherwise(() => t('select_author'))}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            onValueChange={(newValue) => {
              event.next(newValue);
            }}
            placeholder={t('search')}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {match(loading)
                .with(true, () => t('loading'))
                .otherwise(() => t('no_author_found'))}
            </CommandEmpty>
            <CommandSeparator />
            <CommandGroup className="px-2">
              {allAuthors?.map((type) => (
                <CommandItem
                  className="px-2 py-3"
                  keywords={[type.description, type.name]}
                  key={type.id}
                  value={String(type.id)}
                  onSelect={(currentValue) => {
                    const selectedId = Number(currentValue);
                    onChange(selectedId);
                    handleClose();
                  }}
                >
                  <Avatar className="size-5">
                    <AvatarImage src={getImageUrl(type.avatar)} />
                  </Avatar>
                  {type.name}
                  <Check
                    visibility={match(value)
                      .with(type.id, () => 'visible')
                      .otherwise(() => 'hidden')}
                    className={cn('ml-auto')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
