/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:25:08
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/CollectionSelect/index.tsx
 */
import {
  Box,
  BoxProps,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { useI18n } from 'i18n';
import { FocusEventHandler, ForwardedRef, useImperativeHandle, useMemo, useState } from 'react';
import React from 'react';
import { match } from 'ts-pattern';
import {
  AllCollectionItem,
  CollectionLoadingState,
  useAllCollection,
} from '@bookmarks/features/Collections/collectionSlice';
import { Add } from '@mui/icons-material';
import CollectionSelect from '../CollectionSelect';

export interface CollectionMultiSelectProps extends Omit<BoxProps, 'name' | 'onChange' | 'onBlur' | 'value'> {
  onChange: (newValue: number[] | null | undefined) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | null | undefined;
}

function CollectionMultiSelect(
  { onChange, value, sx, ...props }: CollectionMultiSelectProps,
  ref: ForwardedRef<HTMLDivElement | null>,
) {
  const { value: allCollection, fetchData } = useAllCollection();
  const content = useMemo(
    () =>
      match(allCollection)
        .with({ tag: CollectionLoadingState.init }, () => null)
        .with({ tag: CollectionLoadingState.error }, ({ value }) => (
          <Box>
            {value.toString()} <Button onClick={fetchData}>{t('refresh')}</Button>
          </Box>
        ))
        .with({ tag: CollectionLoadingState.loading }, () => <CircularProgress />)
        .with({ tag: CollectionLoadingState.state }, ({ value: allCollections }) => (
          <InnerCollectionSelect onChange={onChange} value={value} allCollections={allCollections} />
        ))
        .otherwise(() => null),
    [allCollection, value, fetchData, onChange],
  );
  const t = useI18n();
  const [sourceRef, setSourceRef] = React.useState<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => sourceRef, [sourceRef]);
  return (
    <Box {...props} ref={setSourceRef} sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      {content}
    </Box>
  );
}

export default React.forwardRef(CollectionMultiSelect);

interface InnerCollectionSelectProps {
  allCollections: Map<number, AllCollectionItem>;
  onChange: (newValue: number[] | null | undefined) => void;
  value: number[] | null | undefined;
}

function InnerCollectionSelect({ allCollections, onChange, value }: InnerCollectionSelectProps) {
  const selectList = useMemo(
    () => value?.map((id) => allCollections.get(id)).filter((item) => item !== undefined) ?? [],
    [allCollections, value],
  );
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const [selected, setSelected] = useState<number | null>(null);

  const t = useI18n();
  const onAddItem = () => {
    if (!selected) {
      return;
    }
    if (!value) {
      onChange([selected]);
      handleClose();
      return;
    }
    if (!value.includes(selected)) {
      onChange([...value, selected]);
    }
    handleClose();
  };
  const onDelete = (id: number) => {
    if (!value) {
      return;
    }
    onChange(value.filter((item) => item !== id));
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {selectList.map(({ path, id }) => (
        <Chip label={path} key={id} onDelete={() => onDelete(id)} />
      ))}
      <IconButton onClick={() => setOpen(true)}>
        <Add />
      </IconButton>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} component="form">
          <DialogTitle>{t('select_collection')}</DialogTitle>

          <CollectionSelect
            selected={selected}
            setSelected={setSelected}
            allCollections={allCollections}
            onAddItem={onAddItem}
            onDelete={onDelete}
          />

          <DialogActions>
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button disabled={selected === null} onClick={onAddItem}>
              {t('submit')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
