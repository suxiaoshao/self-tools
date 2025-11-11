import { useI18n } from 'i18n';
import { type ComponentProps, type FocusEventHandler, useMemo } from 'react';
import { match } from 'ts-pattern';
import { graphql } from '@bookmarks/gql';
import { useQuery } from '@apollo/client/react';
import { Popover, PopoverContent, PopoverTrigger } from '@portal/components/ui/popover';
import { Badge } from '@portal/components/ui/badge';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@portal/components/ui/button';
import { cn } from '@portal/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@portal/components/ui/command';

const AllTags = graphql(`
  query allTags {
    allTags {
      id
      name
    }
  }
`);

export interface TagsSelectProps extends Omit<ComponentProps<'div'>, 'name' | 'onChange' | 'onBlur' | 'value'> {
  onChange: (event: number[]) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | null | undefined;
}

export default function TagsSelect({ value, onChange, className, ...props }: TagsSelectProps) {
  const { data: { allTags } = {}, loading } = useQuery(AllTags);
  const selectedTags = useMemo(() => {
    if (!allTags || !value) return [];
    return value.map((id) => allTags.find((tag) => tag.id === id)).filter((value) => value !== undefined);
  }, [allTags, value]);
  const t = useI18n();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'w-full rounded-md border border-input bg-background flex items-center p-1.5',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            className,
          )}
          {...props}
        >
          <div className="flex-[1_1_0] flex gap-1 overflow-x-auto">
            {selectedTags.map(({ id, name }) => (
              <Badge variant="secondary" key={id}>
                {name}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="data-[state=open]:bg-muted size-6 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (value) {
                      const newValue = value.filter((i) => i !== id);
                      onChange(newValue);
                    }
                  }}
                >
                  <X />
                </Button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder={t('search')} className="h-9" />
          <CommandList>
            <CommandEmpty>
              {match(loading)
                .with(true, () => t('loading'))
                .otherwise(() => t('no_tags_found'))}
            </CommandEmpty>
            <CommandSeparator />
            <CommandGroup>
              {allTags?.map((type) => (
                <CommandItem
                  key={type.id}
                  value={String(type.id)}
                  keywords={[type.name]}
                  onSelect={(currentValue: string) => {
                    const newValue = match(value?.includes(Number(currentValue)))
                      .with(true, () => value?.filter((id) => id !== Number(currentValue)))
                      .otherwise(() => [...(value || []), Number(currentValue)]);
                    onChange(newValue ?? []);
                  }}
                >
                  {type.name}
                  <Check
                    visibility={match(value?.includes(type.id))
                      .with(true, () => 'visible')
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
