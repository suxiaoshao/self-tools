import { useI18n } from 'i18n';
import { type ComponentProps, useMemo } from 'react';
import { match } from 'ts-pattern';
import { graphql } from '@bookmarks/gql';
import { useQuery } from '@apollo/client/react';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@portal/components/ui/combobox';

const AllTags = graphql(`
  query allTags {
    allTags {
      id
      name
    }
  }
`);

export interface TagsSelectProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value'> {
  onChange: (event: number[]) => void;
  value: number[] | null | undefined;
}

export default function TagsSelect({ value, onChange, className, ...props }: TagsSelectProps) {
  const { data: { allTags } = {}, loading } = useQuery(AllTags);
  const tags = useMemo(() => allTags ?? [], [allTags]);
  const selectedTags = useMemo(() => {
    if (!value || !allTags) return [];
    return allTags.filter((tag) => value.includes(tag.id));
  }, [allTags, value]);
  const t = useI18n();
  const anchor = useComboboxAnchor();

  return (
    <Combobox<(typeof tags)[number], true>
      multiple
      items={tags}
      itemToStringValue={(item) => item.name}
      value={selectedTags}
      onValueChange={(newValue) => {
        onChange(newValue.map((item) => item.id));
      }}
    >
      <ComboboxChips ref={anchor} className={className}>
        <ComboboxValue>
          {(values: (typeof tags)[number][]) => (
            <>
              {values.map((tag) => (
                <ComboboxChip key={tag.id}>{tag.name}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={t('search')} {...props} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>
          {match(loading)
            .with(true, () => t('loading'))
            .otherwise(() => t('no_tags_found'))}
        </ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
