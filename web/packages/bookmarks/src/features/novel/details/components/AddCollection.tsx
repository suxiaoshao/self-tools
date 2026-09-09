import { RequestNotice } from 'custom-graphql';
import { checkNovelState } from '@bookmarks/features/novel/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useMutation } from '@apollo/client/react';
import { CollectionSelect } from 'collection-tree';
import { CollectionLoadingState, useAllCollection } from '@bookmarks/entities/collection';
import { graphql } from '@bookmarks/gql/index';
import { useDialog } from 'hooks';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Plus } from 'lucide-react';
import { useI18n } from 'i18n';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { type InferInput, number, object } from 'valibot';
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

const AddCollectionForNovel = graphql(`
  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {
    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {
      __typename
      ... on CollectionMembershipChanged {
        collectionId
        resource {
          kind
          id
        }
        present
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
      ... on MissingResources {
        resources {
          kind
          id
        }
      }
      ... on Conflict {
        reason
        resources {
          kind
          id
        }
      }
    }
  }
`);

interface AddCollectionProps {
  novelId: number;
  refetch: () => void;
}

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export default function AddCollection({ novelId, refetch }: AddCollectionProps) {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks');
  const { open, handleClose, handleOpenChange } = useDialog();
  const { value: allCollection, fetchData } = useAllCollection();

  const t = useI18n();
  const [fn] = useMutation(AddCollectionForNovel);

  const { control, handleSubmit } = useForm<SelectCollectionType>({
    resolver: valibotResolver(object({ collectionId: number(t('request_required')) })),
  });
  const onSubmit = handleSubmit(async ({ collectionId }) => {
    if (
      !(await write.execute(
        async () => (await fn({ variables: { collectionId, novelId } })).data?.addCollectionForNovel,
        {
          verify: () => checkNovelState(client, novelId, { collectionId, present: true }),
          confirmed: () => {
            handleClose();
            refetch();
          },
        },
      ))
    )
      return;
    handleClose();
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
  });
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label={t('add_collection')} />}>
        <Plus />
      </DialogTrigger>
      <DialogContent>
        <form noValidate onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t('select_collection')}</DialogTitle>
          </DialogHeader>
          {match(allCollection)
            .with({ tag: CollectionLoadingState.init }, () => null)
            .with({ tag: CollectionLoadingState.error }, ({ value }) => (
              <RequestNotice error={value} retry={fetchData} />
            ))
            .with({ tag: CollectionLoadingState.loading }, () => <Spinner />)
            .with({ tag: CollectionLoadingState.state }, ({ value: allCollections }) => (
              <Controller
                control={control}
                name="collectionId"
                render={({ field, fieldState }) => (
                  <CollectionSelect
                    disabled={write.blocked}
                    {...field}
                    allCollections={allCollections}
                    errorMessage={fieldState.error?.message}
                  />
                )}
              />
            ))
            .otherwise(() => null)}

          {write.notice}
          <DialogFooter>
            <DialogClose render={<Button />}>{t('cancel')}</DialogClose>
            <Button disabled={write.blocked} type="submit">
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
