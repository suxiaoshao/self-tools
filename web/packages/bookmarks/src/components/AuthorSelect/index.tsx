import {
  Autocomplete,
  AutocompleteProps,
  Avatar,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { FocusEventHandler, useEffect, useMemo, useState } from 'react';
import { debounceTime, Subject } from 'rxjs';
import { SearchAuthorQuery, useSearchAuthorQuery } from '../../graphql';

export interface TagsSelectProps
  extends Omit<
    AutocompleteProps<SearchAuthorQuery['queryAuthors'][0], false, false, false>,
    'name' | 'onChange' | 'onBlur' | 'value' | 'renderInput' | 'options'
  > {
  onChange: (event: SelectChangeEvent<number>, value: number | null | undefined) => void;
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
  return (
    <Autocomplete<SearchAuthorQuery['queryAuthors'][0], false, false, false>
      sx={sx}
      onBlur={onBlur}
      value={queryAuthors?.find((author) => author.id === value)}
      onChange={(event: React.SyntheticEvent, newValue) => {
        event.target = { value: newValue?.id, ...event.target } as unknown as EventTarget;
        onChange(event as SelectChangeEvent<number>, newValue?.id);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      options={queryAuthors ?? []}
      getOptionLabel={({ name }) => name}
      loading={loading}
      renderInput={(params) => (
        <TextField {...params} onChange={(e) => event.next(e.target.value)} label="作者" fullWidth />
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
