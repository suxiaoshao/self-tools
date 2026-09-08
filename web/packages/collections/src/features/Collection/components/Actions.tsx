import { attemptWrite, useWriteAction, WriteNotice } from 'custom-graphql';
import { collectionResult, deleteResult } from '@collections/results';
import { checkCollection, checkDeleted } from '@collections/reconcile';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import { match } from 'ts-pattern';
import type { CollectionAndItem } from '../types';
import useDialog from '@collections/hooks/useDialog';
import EditItemForm from '../../Item/Components/EditItemForm';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@collections/gql';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { DropdownMenuItem } from '@portal/components/ui/dropdown-menu';
import { Dialog } from '@portal/components/ui/dialog';

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

export const DeleteItem = graphql(`
  mutation deleteItem($id: Int!) {
    deleteItem(id: $id) {
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

type TableActionsProps = CollectionAndItem & {
  refetch: () => void;
};

export default function Actions({ id, refetch, __typename, ...data }: TableActionsProps) {
  const client = useApolloClient();
  const deletion = useWriteAction();
  const [deleteCollection] = useMutation(DeleteCollection);
  const [deleteItem] = useMutation(DeleteItem);
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
                __typename === 'Collection'
                  ? attemptWrite(
                      () => deleteCollection({ variables: { id } }),
                      (response) => deleteResult(response.data?.deleteCollection),
                    )
                  : attemptWrite(
                      () => deleteItem({ variables: { id } }),
                      (response) => deleteResult(response.data?.deleteItem),
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
          if (await deletion.check(() => checkDeleted(client, id, __typename)))
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
        }}
      />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {match(__typename)
          .with('Collection', () => (
            <CollectionForm
              mode="edit"
              initialValues={data}
              handleClose={handleClose}
              afterSubmit={collectionAfterSubmit}
              checkResult={(data) => checkCollection(client, id, data)}
            />
          ))
          .otherwise(() => open && <EditItemForm key={id} id={id} handleClose={handleClose} refresh={refetch} />)}
      </Dialog>
    </>
  );
}

export function DeleteItemAction({ id, refetch }: { id: number; refetch: () => unknown }) {
  const client = useApolloClient();
  const action = useWriteAction();
  const t = useI18n();
  const [remove] = useMutation(DeleteItem);
  return (
    <>
      <TableActions>
        {() => [
          {
            text: t('delete'),
            onClick: async () => {
              const result = await action.run(() =>
                attemptWrite(
                  () => remove({ variables: { id } }),
                  (response) => deleteResult(response.data?.deleteItem),
                ),
              );
              if (result?.status === 'saved')
                void Promise.resolve()
                  .then(refetch)
                  .catch(() => undefined);
            },
          },
        ]}
      </TableActions>
      <WriteNotice
        outcome={action.outcome}
        pending={action.pending}
        check={async () => {
          if (await action.check(() => checkDeleted(client, id, 'Item')))
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
        }}
      />
    </>
  );
}
