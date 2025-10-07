import { MenuItem } from '@mui/material';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import { match, P } from 'ts-pattern';
import type { CollectionAndItem } from '../types';
import useDialog from '@collections/hooks/useDialog';
import ItemForm, { type ItemFormData } from '../../Item/Components/ItemForm';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@collections/gql';
import { useLazyQuery, useMutation } from '@apollo/client/react';

const DeleteCollection = graphql(`
  mutation deleteCollection($id: Int!) {
    deleteCollection(id: $id) {
      path
    }
  }
`);

const DeleteItem = graphql(`
  mutation deleteItem($id: Int!) {
    deleteItem(id: $id) {
      name
    }
  }
`);

const GetEditItem = graphql(`
  query getEditItem($id: Int!) {
    getItem(id: $id) {
      name
      content
      collections {
        id
      }
    }
  }
`);

const UpdateCollection = graphql(`
  mutation updateCollection($id: Int!, $name: String!, $description: String) {
    updateCollection(id: $id, name: $name, description: $description) {
      path
    }
  }
`);

const UpdateItem = graphql(`
  mutation updateItem($id: Int!, $name: String!, $content: String!) {
    updateItem(id: $id, name: $name, content: $content) {
      id
      name
      content
    }
  }
`);

export type TableActionsProps = CollectionAndItem & {
  refetch: () => void;
};

export default function Actions({ id, refetch, __typename, ...data }: TableActionsProps) {
  const [deleteCollection] = useMutation(DeleteCollection);
  const [deleteItem] = useMutation(DeleteItem);
  const [updateCollection] = useMutation(UpdateCollection);
  const [updateItem] = useMutation(UpdateItem);
  const [fetchItem, { loading, data: editItemData }] = useLazyQuery(GetEditItem);
  const { open, handleClose, handleOpen } = useDialog();
  const collectionAfterSubmit = async ({ name, description }: CollectionFormData) => {
    await updateCollection({ variables: { id, name, description } });
    refetch();
  };
  const itemAfterSubmit = async ({ name, content }: ItemFormData) => {
    await updateItem({ variables: { id, name, content } });
    refetch();
  };
  const t = useI18n();

  return (
    <>
      <TableActions>
        {(onClose) => [
          {
            text: t('delete'),
            onClick: async () => {
              if (__typename === 'Collection') {
                await deleteCollection({ variables: { id } });
              } else {
                await deleteItem({ variables: { id } });
              }
              onClose();
              refetch();
            },
          },
          <MenuItem
            key="edit"
            onClick={() => {
              if (__typename === 'Item') {
                fetchItem({ variables: { id } });
              }
              onClose();
              handleOpen();
            }}
          >
            {t('edit')}
          </MenuItem>,
        ]}
      </TableActions>
      {match(__typename)
        .with('Collection', () => (
          <CollectionForm
            mode="edit"
            initialValues={data}
            open={open}
            handleClose={handleClose}
            afterSubmit={collectionAfterSubmit}
          />
        ))
        .otherwise(() => (
          <ItemForm
            loading={loading}
            initialValues={match(editItemData?.getItem)
              .with(P.nonNullable, ({ collections, content, name }) => ({
                collectionIds: collections.map((collection) => collection.id),
                content: content,
                name: name,
              }))
              //oxlint-disable-next-line unicorn/no-useless-undefined
              .otherwise(() => undefined)}
            mode="edit"
            open={open}
            handleClose={handleClose}
            afterSubmit={itemAfterSubmit}
          />
        ))}
    </>
  );
}
