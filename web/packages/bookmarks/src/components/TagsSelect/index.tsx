import { Box, Chip, FormControl, FormControlProps, InputLabel, MenuItem, OutlinedInput, Select } from '@mui/material';
import { useI18n } from 'i18n';
import { FocusEventHandler, useMemo } from 'react';
import { useAllowTagsQuery } from '../../graphql';

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
  collectionId: number | null | undefined;
  onChange: (event: number) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | number | null | undefined;
}

export default function TagsSelect({ collectionId, value, onChange, onBlur, sx, ...props }: TagsSelectProps) {
  const { data: { queryTags } = {}, loading } = useAllowTagsQuery({ variables: { collectionId } });
  const formValue = useMemo(() => {
    if (value === null || value === undefined) {
      return undefined;
    } else if (typeof value === 'number') {
      return [value];
    } else {
      return value;
    }
  }, [value]);
  const t = useI18n();

  return (
    <FormControl {...props} sx={sx}>
      <InputLabel>{t('tags')}</InputLabel>
      <Select
        multiple
        value={formValue}
        onChange={(e) => {
          if (typeof e.target.value === 'number') {
            onChange(e.target.value);
          }
        }}
        onBlur={onBlur}
        input={<OutlinedInput label={t('tags')} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected?.map((value) => <Chip key={value} label={queryTags?.find(({ id }) => id === value)?.name} />)}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {loading ? (
          <MenuItem disabled>Loading...</MenuItem>
        ) : (
          <>
            {queryTags?.map(({ name, id }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
            {(queryTags?.length ?? 0) === 0 && <MenuItem disabled>No options</MenuItem>}
          </>
        )}
      </Select>
    </FormControl>
  );
}
