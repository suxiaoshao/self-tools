import { RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material';
import { Box, BoxProps, Breadcrumbs, Button, Link } from '@mui/material';
import { FocusEventHandler } from 'react';
import { useGetCollectionAncestorsQuery, useGetCollectionSelectQuery } from '../../graphql';
import CustomSelector from '../CustomSelector';

export interface CollectionSelectProps extends Omit<BoxProps, 'name' | 'onChange' | 'onBlur' | 'value'> {
  onChange: (event: { target: { value: number | null | undefined } }, newValue: number | null | undefined) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number | null | undefined;
}

export default function CollectionSelect({ onChange, onBlur, value, sx, ...props }: CollectionSelectProps) {
  const { data: { getCollection } = {} } = useGetCollectionAncestorsQuery({
    variables: { id: value ?? 0 },
    skip: value === undefined || value === null,
  });
  const { data: { getCollectionList } = {} } = useGetCollectionSelectQuery({ variables: { parentId: value } });

  return (
    <Box {...props} sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Breadcrumbs>
        <Link underline="hover" onClick={() => onChange({ target: { value: null } }, null)}>
          根目录
        </Link>
        {getCollection &&
          getCollection.ancestors.map(({ name, id }) => (
            <Link underline="hover" key={id} onClick={() => onChange({ target: { value: id } }, id)}>
              {name}
            </Link>
          ))}
        {getCollection && (
          <Link
            underline="hover"
            key={value}
            color="text.primary"
            onClick={() => onChange({ target: { value } }, value)}
          >
            {getCollection?.name}
          </Link>
        )}
      </Breadcrumbs>

      <CustomSelector<number | null | undefined>
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        render={(onClick) => (
          <Button
            startIcon={getCollection ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
            sx={{ ml: 2 }}
            onClick={onClick}
            variant="outlined"
            size="large"
          >
            {getCollection?.name ?? '空集合'}
          </Button>
        )}
      >
        {[
          ...(getCollectionList?.map(({ id, name }) => ({ value: id, label: name, key: id })) ?? []),
          ...(getCollection
            ? [
                {
                  value: getCollection?.id,
                  label: getCollection?.name,
                  key: getCollection?.id,
                },
              ]
            : []),
        ]}
      </CustomSelector>
    </Box>
  );
}
