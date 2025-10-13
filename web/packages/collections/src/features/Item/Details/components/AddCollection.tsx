import CollectionSelect from '@collections/components/CollectionSelect';
import { CollectionLoadingState, useAllCollection } from '@collections/features/Collection/collectionSlice';
import useDialog from '@collections/hooks/useDialog';
import { Add } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogTitle, IconButton } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql';
import { type InferInput, number, object } from 'valibot';
import { useMutation } from '@apollo/client/react';
import { valibotResolver } from '@hookform/resolvers/valibot';

const AddCollectionForItem = graphql(`
  mutation addCollectionForItem($itemId: Int!, $collectionId: Int!) {
    addCollectionForItem(itemId: $itemId, collectionId: $collectionId) {
      id
    }
  }
`);

interface AddCollectionProps {
  itemId: number;
  refetch: () => void;
}

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export default function AddCollection({ itemId, refetch }: AddCollectionProps) {
  const { open, handleClose, handleOpen } = useDialog();
  const t = useI18n();
  const { value: allCollection, fetchData } = useAllCollection();
  const [fn] = useMutation(AddCollectionForItem);

  const { control, handleSubmit } = useForm<SelectCollectionType>({
    resolver: valibotResolver(selectCollectionSchema),
  });
  const onSubmit = handleSubmit(async ({ collectionId }) => {
    await fn({ variables: { collectionId, itemId } });
    handleClose();
    refetch();
  });
  return (
    <>
      <IconButton onClick={handleOpen}>
        <Add />
      </IconButton>
      <Dialog slotProps={{ paper: { sx: { maxWidth: 700 } } }} open={open} onClose={handleClose}>
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
