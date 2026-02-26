import { useMutation } from '@apollo/client/react';
import CollectionSelect from '@bookmarks/components/CollectionSelect';
import { CollectionLoadingState, useAllCollection } from '@bookmarks/features/Collections/collectionSlice';
import { graphql } from '@bookmarks/gql';
import useDialog from '@collections/hooks/useDialog';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Plus } from 'lucide-react';
import { useI18n } from 'i18n';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { type InferInput, number, object } from 'valibot';
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

const AddCollectionForNovel = graphql(`
  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {
    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {
      id
    }
  }
`);

export interface AddCollectionProps {
  novelId: number;
  refetch: () => void;
}

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export default function AddCollection({ novelId, refetch }: AddCollectionProps) {
  const { open, handleClose, handleOpenChange } = useDialog();
  const { value: allCollection, fetchData } = useAllCollection();

  const t = useI18n();
  const [fn] = useMutation(AddCollectionForNovel);

  const { control, handleSubmit } = useForm<SelectCollectionType>({
    resolver: valibotResolver(selectCollectionSchema),
  });
  const onSubmit = handleSubmit(async ({ collectionId }) => {
    await fn({ variables: { collectionId, novelId } });
    handleClose();
    refetch();
  });
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
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
            <DialogClose render={<Button />}>{t('cancel')}</DialogClose>
            <Button type="submit">{t('submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
