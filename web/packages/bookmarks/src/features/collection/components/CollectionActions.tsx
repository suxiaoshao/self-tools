import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
import { checkCollection } from '@bookmarks/features/collection/model/reconcile';
import { checkDeleted } from '@bookmarks/features/collection/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useDialog } from 'hooks';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import type { CollectionTableData } from '../types';
import { graphql } from '@bookmarks/gql/index';
import { useMutation } from '@apollo/client/react';
import { DropdownMenuItem } from 'ui/components/dropdown-menu';

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
  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {
    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {
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

type CollectionActionsProps = CollectionTableData & {
  refetch: () => Promise<void>;
};

export default function CollectionActions({ id, refetch, ...data }: CollectionActionsProps) {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks/collections');
  const deletion = useBookmarkWrite('/bookmarks/collections');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCollection] = useMutation(DeleteCollection);
  const [editCollection] = useMutation(UpdateCollection);
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
  const t = useI18n();
  const onSubmit = async ({ name, description }: CollectionFormData) => {
    if (
      !(await write.execute(
        async () =>
          (await editCollection({ variables: { description, id, name, parentId: data.parentId } })).data
            ?.updateCollection,
        {
          verify: () => checkCollection(client, id, { name, description, parentId: data.parentId }),
          confirmed: () => {
            handleClose();
            void refetch();
          },
        },
      ))
    )
      return;
    handleClose();
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
  };
  return (
    <>
      <ConfirmationDialog
        returnFocus={() => document.getElementById(`bookmark-collection-actions-${deleteTarget?.id}`)}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('delete_target', { name: deleteTarget?.name })}
        description={t('delete_collection_impact')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        pending={deletion.pending}
        confirmDisabled={deletion.blocked}
        notice={deletion.notice}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const { id } = deleteTarget;
          const confirmed = () => {
            setConfirmOpen(false);
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
          };
          if (
            await deletion.execute(async () => (await deleteCollection({ variables: { id } })).data?.deleteCollection, {
              verify: () => checkDeleted(client, id),
              confirmed,
            })
          )
            confirmed();
        }}
      />
      <TableActions triggerId={`bookmark-collection-actions-${id}`}>
        {() => [
          {
            text: t('delete'),
            disabled: deletion.pending || write.blocked,
            onClick: () => {
              if (!deletion.blocked) setDeleteTarget({ id, name: data.name });
              setConfirmOpen(true);
            },
          },
          <DropdownMenuItem
            key="edit"
            disabled={deletion.blocked}
            onClick={() => {
              handleOpen();
            }}
          >
            {t('edit')}
          </DropdownMenuItem>,
        ]}
      </TableActions>
      <CollectionForm
        mode="edit"
        notice={write.notice}
        disabled={write.blocked}
        afterSubmit={onSubmit}
        onOpenChange={handleOpenChange}
        open={open}
        initialValues={data}
      />
    </>
  );
}
