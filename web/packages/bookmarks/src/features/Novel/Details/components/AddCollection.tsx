import CollectionSelect from '@bookmarks/components/CollectionSelect';
import { CollectionLoadingState, useAllCollection } from '@bookmarks/features/Collections/collectionSlice';
import { useAddCollectionForNovelMutation } from '@bookmarks/graphql';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Add } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogTitle, IconButton } from '@mui/material';
import { useI18n } from 'i18n';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { type InferInput, number, object } from 'valibot';

export interface AddCollectionProps {
  novelId: number;
  refetch: () => void;
}

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export default function AddCollection({ novelId, refetch }: AddCollectionProps) {
  const [open, setOpen] = useState(false);
  const { value: allCollection, fetchData } = useAllCollection();

  const t = useI18n();
  const [fn] = useAddCollectionForNovelMutation();

  const { reset, control, handleSubmit } = useForm<SelectCollectionType>({
    resolver: valibotResolver(selectCollectionSchema),
  });

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    reset();
    setOpen(false);
  };
  const onSubmit = handleSubmit(async ({ collectionId }) => {
    await fn({ variables: { collectionId, novelId } });
    handleClose();
    refetch();
  });
  return (
    <>
      <IconButton onClick={handleOpen}>
        <Add />
      </IconButton>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} component="form" onSubmit={onSubmit}>
          <DialogTitle>{t('select_collection')}</DialogTitle>
          {match(allCollection)
            .with({ tag: CollectionLoadingState.init }, () => null)
            .with({ tag: CollectionLoadingState.error }, ({ value }) => (
              <Box>
                {value.toString()} <Button onClick={fetchData}>{t('refresh')}</Button>
              </Box>
            ))
            .with({ tag: CollectionLoadingState.loading }, () => <CircularProgress />)
            .with({ tag: CollectionLoadingState.state }, ({ value: allCollections }) => (
              <Controller
                control={control}
                name="collectionId"
                render={({ field, fieldState }) => (
                  <CollectionSelect
                    {...field}
                    allCollections={allCollections}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
            ))
            .otherwise(() => null)}

          <DialogActions>
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit">{t('submit')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
