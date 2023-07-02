import {
  Autocomplete,
  AutocompleteProps,
  Avatar,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  TextField,
} from '@mui/material';
import { useI18n } from 'i18n';
import { FocusEventHandler, useEffect, useMemo, useState } from 'react';
import { debounceTime, Subject } from 'rxjs';
import { SearchAuthorQuery, useSearchAuthorQuery } from '../../graphql';

export interface TagsSelectProps
  extends Omit<
    AutocompleteProps<SearchAuthorQuery['queryAuthors'][0], false, false, false>,
    'name' | 'onChange' | 'onBlur' | 'value' | 'renderInput' | 'options'
  > {
  onChange: (value: number) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number | null | undefined;
}

export default function AuthorSelect({ onBlur, onChange, sx, value, ...props }: TagsSelectProps) {
  const [searchName, setSearchName] = useState('');

  const { loading, data: { queryAuthors } = {} } = useSearchAuthorQuery({ variables: { searchName } });
  const event = useMemo(() => new Subject<string>(), []);
  useEffect(() => {
    const key = event.pipe(debounceTime(300)).subscribe((value) => setSearchName(value));
    return () => {
      key.unsubscribe();
    };
  }, [event]);
  const t = useI18n();
  return (
    <Autocomplete<SearchAuthorQuery['queryAuthors'][0], false, false, false>
      sx={sx}
      onBlur={onBlur}
      value={queryAuthors?.find((author) => author.id === value)}
      onChange={(event: React.SyntheticEvent, newValue) => {
        if (newValue?.id) {
          onChange(newValue?.id);
        }
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      options={queryAuthors ?? []}
      getOptionLabel={({ name }) => name}
      loading={loading}
      renderInput={(params) => (
        <TextField {...params} onChange={(e) => event.next(e.target.value)} label={t('author')} fullWidth />
      )}
      renderOption={(props, { name, avatar }) => (
        <MenuItem {...props}>
          <ListItemAvatar>
            <Avatar src={avatar} />
          </ListItemAvatar>
          <ListItemText>{name}</ListItemText>
        </MenuItem>
      )}
      {...props}
    />
  );
}
