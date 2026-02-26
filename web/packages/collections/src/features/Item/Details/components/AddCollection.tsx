import CollectionSelect from '@collections/components/CollectionSelect';
import { CollectionLoadingState, useAllCollection } from '@collections/features/Collection/collectionSlice';
import useDialog from '@collections/hooks/useDialog';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql';
import { type InferInput, number, object } from 'valibot';
import { useMutation } from '@apollo/client/react';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Button } from '@portal/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@portal/components/ui/dialog';
import { Spinner } from '@portal/components/ui/spinner';

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
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon-lg" className="rounded-full" onClick={handleOpen} />}>
        <Plus />
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t('select_collection')}</DialogTitle>
          </DialogHeader>
          {match(allCollection)
            .with({ tag: CollectionLoadingState.init }, () => null)
            .with({ tag: CollectionLoadingState.error }, ({ value }) => (
              <div>
                {value.toString()} <Button onClick={fetchData}>{t('refresh')}</Button>
              </div>
            ))
            .with({ tag: CollectionLoadingState.loading }, () => <Spinner />)
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

          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
            <Button variant="default" type="submit">
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
