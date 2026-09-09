import { checkCollection } from '@bookmarks/reconcile';
import { checkDeleted } from '@bookmarks/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import useDialog from '@collections/hooks/useDialog';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import type { CollectionTableData } from '../types';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';
import { DropdownMenuItem } from '@portal/components/ui/dropdown-menu';

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
      {write.notice}
      <TableActions>
        {() => [
          {
            text: t('delete'),
            onClick: async () => {
              if (
                !(await write.execute(
                  async () => (await deleteCollection({ variables: { id } })).data?.deleteCollection,
                  { verify: () => checkDeleted(client, id, 'Collection'), confirmed: refetch },
                ))
              )
                return;
              void Promise.resolve()
                .then(() => refetch())
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
