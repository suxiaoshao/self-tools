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
import { FocusEventHandler } from 'react';
import { useForm } from 'react-hook-form';
import { SearchAuthorQuery, SearchAuthorQueryVariables, useSearchAuthorQuery } from '../../graphql';

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
  const { watch, register } = useForm<SearchAuthorQueryVariables>();

  const searchName = watch('searchName');
  const { loading, data: { queryAuthors } = {} } = useSearchAuthorQuery({ variables: { searchName } });
  return (
    <Autocomplete<SearchAuthorQuery['queryAuthors'][0], false, false, false>
      sx={sx}
      onBlur={onBlur}
      value={queryAuthors?.find((author) => author.id === value)}
      onChange={(event: React.SyntheticEvent, newValue) => {
        event.target = { value: newValue?.id, ...event.target } as EventTarget;
        onChange(event as SelectChangeEvent<number>, newValue?.id);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      options={queryAuthors ?? []}
      getOptionLabel={({ name }) => name}
      loading={loading}
      renderInput={(params) => <TextField {...params} {...register('searchName')} label="作者" fullWidth />}
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
