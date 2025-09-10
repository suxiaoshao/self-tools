/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:25:08
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/CollectionSelect/index.tsx
 */
import {
  type AllCollectionItem,
  CollectionLoadingState,
  useAllCollection,
} from '@bookmarks/features/Collections/collectionSlice';
import { Add } from '@mui/icons-material';
import {
  Box,
  type BoxProps,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { useI18n } from 'i18n';
import React, { type FocusEventHandler, type ForwardedRef, useImperativeHandle, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import CollectionSelect from '../CollectionSelect';
import { Controller, useForm } from 'react-hook-form';
import { number, object, type InferInput } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export interface CollectionMultiSelectProps extends Omit<BoxProps, 'name' | 'onChange' | 'onBlur' | 'value'> {
  onChange: (newValue: number[] | null | undefined) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | null | undefined;
  ref: ForwardedRef<HTMLDivElement | null>;
}

function CollectionMultiSelect({ onChange, value, sx, ref, ...props }: CollectionMultiSelectProps) {
  const { value: allCollection, fetchData } = useAllCollection();
  const t = useI18n();
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
    [allCollection, value, fetchData, onChange, t],
  );
  const [sourceRef, setSourceRef] = React.useState<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => sourceRef, [sourceRef]);
  return (
    // oxlint-disable-next-line typescript/no-misused-spread
    <Box {...props} ref={setSourceRef} sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      {content}
    </Box>
  );
}

export default CollectionMultiSelect;

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

  const t = useI18n();
  const onDelete = (id: number) => {
    if (!value) {
      return;
    }
    onChange(value.filter((item) => item !== id));
  };

  const { reset, control, handleSubmit } = useForm<SelectCollectionType>({
    resolver: valibotResolver(selectCollectionSchema),
  });

  const handleClose = () => {
    reset();
    setOpen(false);
  };
  const onSubmit = handleSubmit(({ collectionId }) => {
    if (!value) {
      onChange([collectionId]);
      handleClose();
      return;
    }
    if (!value.includes(collectionId)) {
      onChange([...value, collectionId]);
    }
    handleClose();
  });

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {selectList.map(({ path, id }) => (
        <Chip
          label={path}
          key={id}
          onDelete={() => {
            onDelete(id);
          }}
        />
      ))}
      <IconButton
        onClick={() => {
          setOpen(true);
        }}
      >
        <Add />
      </IconButton>
      <Dialog slotProps={{ paper: { sx: { maxWidth: 700 } } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} component="form" onSubmit={onSubmit}>
          <DialogTitle>{t('select_collection')}</DialogTitle>
          <Controller
            control={control}
            name="collectionId"
            render={({ field, fieldState }) => (
              <CollectionSelect {...field} allCollections={allCollections} errorMessage={fieldState.error?.message} />
            )}
          />

          <DialogActions>
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit">{t('submit')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
