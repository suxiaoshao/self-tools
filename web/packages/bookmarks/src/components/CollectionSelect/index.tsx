import { Box, BoxProps, Breadcrumbs, Button, Link } from '@mui/material';
import { useI18n } from 'i18n';
import { FocusEventHandler, ForwardedRef, useImperativeHandle } from 'react';
import { useGetCollectionAncestorsQuery, useGetCollectionSelectQuery } from '../../graphql';
import CustomSelector from '../CustomSelector';
import React from 'react';

export interface CollectionSelectProps extends Omit<BoxProps, 'name' | 'onChange' | 'onBlur' | 'value'> {
  onChange: (event: { target: { value: number | null | undefined } }, newValue: number | null | undefined) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number | null | undefined;
}

function CollectionSelect(
  { onChange, onBlur, value, sx, ...props }: CollectionSelectProps,
  ref: ForwardedRef<HTMLButtonElement | null>,
) {
  const { data: { getCollection } = {} } = useGetCollectionAncestorsQuery({
    variables: { id: value ?? 0 },
    skip: value === undefined || value === null,
  });
  const { data: { getCollections } = {} } = useGetCollectionSelectQuery({ variables: { parentId: value } });
  const t = useI18n();
  const [sourceRef, setSourceRef] = React.useState<HTMLButtonElement | null>(null);
  useImperativeHandle<HTMLButtonElement | null, HTMLButtonElement | null>(
    ref,
    () => {
      const proxyRef = sourceRef ? sourceRef : null;
      return proxyRef;
    },
    [sourceRef],
  );
  return (
    <Box {...props} sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Breadcrumbs>
        <Link underline="hover" onClick={() => onChange({ target: { value: null } }, null)}>
          {t('root')}
        </Link>
        {getCollection &&
          getCollection.ancestors.map(({ name, id }) => (
            <Link underline="hover" key={id} onClick={() => onChange({ target: { value: id } }, id)}>
              {name}
            </Link>
          ))}
        <CustomSelector<number | null | undefined>
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          render={(onClick) => (
            <Button size="large" onClick={onClick} variant="outlined" ref={setSourceRef}>
              {getCollection?.name ?? t('empty_collection')}
            </Button>
          )}
        >
          {[
            ...(getCollections?.map(({ id, name }) => ({ value: id, label: name, key: id })) ?? []),
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
      </Breadcrumbs>
    </Box>
  );
}

export default React.forwardRef(CollectionSelect);
