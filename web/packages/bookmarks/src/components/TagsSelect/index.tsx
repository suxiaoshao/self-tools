import {
  Box,
  Chip,
  FormControl,
  type FormControlProps,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from '@mui/material';
import { useI18n } from 'i18n';
import { type FocusEventHandler, useMemo } from 'react';
import { match, P } from 'ts-pattern';
import { graphql } from '@bookmarks/gql';
import { useQuery } from '@apollo/client/react';

const AllTags = graphql(`
  query allTags {
    allTags {
      id
      name
    }
  }
`);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export interface TagsSelectProps extends Omit<FormControlProps, 'name' | 'onChange' | 'onBlur' | 'value'> {
  onChange: (event: number[]) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | number | null | undefined;
}

export default function TagsSelect({ value, onChange, onBlur, sx, ...props }: TagsSelectProps) {
  const { data: { allTags } = {}, loading } = useQuery(AllTags);
  const formValue = useMemo(() => {
    return (
      match(value)
        // eslint-disable-next-line no-useless-undefined
        .with(null, undefined, () => undefined)
        .with(P.number, (v) => [v])
        .otherwise((v) => v)
    );
  }, [value]);
  const t = useI18n();

  return (
    <FormControl {...props} sx={sx}>
      <InputLabel>{t('tags')}</InputLabel>
      <Select
        multiple
        value={formValue}
        onChange={(e) => {
          match(e.target.value).with(P.array(P.number), (value) => onChange(value));
        }}
        onBlur={onBlur}
        input={<OutlinedInput label={t('tags')} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected?.map((value) => (
              <Chip key={value} label={allTags?.find(({ id }) => id === value)?.name} />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {match([loading, allTags?.length])
          .with([true, P._], () => <MenuItem disabled>Loading...</MenuItem>)
          .with([P._, P.number.gt(0)], () =>
            allTags?.map(({ name, id }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            )),
          )
          .otherwise(() => (
            <MenuItem disabled>No options</MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
