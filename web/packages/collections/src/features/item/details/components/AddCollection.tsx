import { attemptWrite, useWriteAction, WriteNotice, RequestNotice } from 'custom-graphql';
import { membershipResult } from '@collections/features/item/model/results';
import { checkMembership } from '@collections/features/item/model/reconcile';
import { CollectionSelect } from 'collection-tree';
import { CollectionLoadingState, useAllCollection } from '@collections/entities/collection';
import { useDialog } from 'hooks';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { useI18n } from 'i18n';
import { AddCollectionForItemDocument as AddCollectionForItem } from '@collections/gql/graphql';
import { type InferInput, number, object } from 'valibot';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Button } from 'ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui/components/dialog';
import { Spinner } from 'ui/components/spinner';

interface AddCollectionProps {
  itemId: number;
  refetch: () => void;
}

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export default function AddCollection({ itemId, refetch }: AddCollectionProps) {
  const client = useApolloClient();
  const action = useWriteAction();
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
  const t = useI18n();
  const { value: allCollection, fetchData } = useAllCollection();
  const [fn] = useMutation(AddCollectionForItem);

  const { control, handleSubmit, getValues } = useForm<SelectCollectionType>({
    resolver: valibotResolver(selectCollectionSchema),
  });
  const onSubmit = handleSubmit(async ({ collectionId }) => {
    const result = await action.run(() =>
      attemptWrite(
        () => fn({ variables: { collectionId, itemId } }),
        (response) => membershipResult(response.data?.addCollectionForItem, true),
      ),
    );
    if (result?.status === 'saved') {
      handleClose();
      void Promise.resolve()
        .then(refetch)
        .catch(() => undefined);
    }
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
                <RequestNotice error={value} retry={fetchData} />
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
                    disabled={action.blocked}
                    allCollections={allCollections}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
            ))
            .otherwise(() => null)}

          <WriteNotice
            outcome={action.outcome}
            pending={action.pending}
            check={async () => {
              if (await action.check(() => checkMembership(client, itemId, getValues('collectionId'), true))) {
                handleClose();
                void Promise.resolve()
                  .then(refetch)
                  .catch(() => undefined);
              }
            }}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
            <Button
              variant="default"
              type="submit"
              disabled={action.blocked || allCollection.tag !== CollectionLoadingState.state}
            >
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
