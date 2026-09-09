import { attemptWrite, useWriteAction, WriteNotice } from 'custom-graphql';
import { collectionResult } from '@collections/features/collection/model/results';
import { deleteResult } from '@collections/results';
import { checkCollection, checkDeleted } from '@collections/features/collection/model/reconcile';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import { useDialog } from 'hooks';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@collections/gql/index';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { DropdownMenuItem } from 'ui/components/dropdown-menu';
import { Dialog } from 'ui/components/dialog';

const DeleteCollection = graphql(`
  mutation deleteCollection($id: Int!) {
    deleteCollection(id: $id) {
      __typename
      ... on ResourceDeleted {
        resource {
          kind
          id
        }
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
    }
  }
`);

const UpdateCollection = graphql(`
  mutation updateCollection($id: Int!, $name: String!, $description: String) {
    updateCollection(id: $id, name: $name, description: $description) {
      __typename
      ... on CollectionSaved {
        collectionId
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

interface CollectionActionsProps {
  id: number;
  name: string;
  description?: string | null;
  refetch: () => void;
}

export default function CollectionActions({ id, refetch, ...data }: CollectionActionsProps) {
  const client = useApolloClient();
  const deletion = useWriteAction();
  const [deleteCollection] = useMutation(DeleteCollection);
  const [updateCollection] = useMutation(UpdateCollection);
  const { open, handleClose, handleOpenChange, handleOpen } = useDialog();
  const collectionAfterSubmit = async ({ name, description }: CollectionFormData) => {
    const result = await attemptWrite(
      () => updateCollection({ variables: { id, name, description } }),
      (response) => collectionResult(response.data?.updateCollection),
    );
    if (result.status === 'saved')
      void Promise.resolve()
        .then(refetch)
        .catch(() => undefined);
    return result;
  };
  const t = useI18n();

  return (
    <>
      <TableActions>
        {() => [
          {
            text: t('delete'),
            onClick: async () => {
              const result = await deletion.run(() =>
                attemptWrite(
                  () => deleteCollection({ variables: { id } }),
                  (response) => deleteResult(response.data?.deleteCollection),
                ),
              );
              if (result?.status === 'saved')
                void Promise.resolve()
                  .then(refetch)
                  .catch(() => undefined);
            },
          },

          <DropdownMenuItem
            key="edit"
            onClick={() => {
              handleOpen();
            }}
          >
            {t('edit')}
          </DropdownMenuItem>,
        ]}
      </TableActions>
      <WriteNotice
        outcome={deletion.outcome}
        pending={deletion.pending}
        check={async () => {
          if (await deletion.check(() => checkDeleted(client, id)))
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
        }}
      />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <CollectionForm
          mode="edit"
          initialValues={data}
          handleClose={handleClose}
          afterSubmit={collectionAfterSubmit}
          checkResult={(data) => checkCollection(client, id, data)}
        />
      </Dialog>
    </>
  );
}
