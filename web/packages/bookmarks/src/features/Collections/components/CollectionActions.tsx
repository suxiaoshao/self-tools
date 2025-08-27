import useDialog from '@collections/hooks/useDialog';
import { MenuItem } from '@mui/material';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import type { CollectionTableData } from '../types';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';

const DeleteCollection = graphql(`
  mutation deleteCollection($id: Int!) {
    deleteCollection(id: $id)
  }
`);

const UpdateCollection = graphql(`
  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {
    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {
      __typename
    }
  }
`);

export type CollectionActionsProps = CollectionTableData & {
  refetch: () => Promise<void>;
};

export default function CollectionActions({ id, refetch, ...data }: CollectionActionsProps) {
  const [deleteCollection] = useMutation(DeleteCollection);
  const [editCollection] = useMutation(UpdateCollection);
  const { open, handleClose, handleOpen } = useDialog();
  const t = useI18n();
  const onSubmit = async ({ name, description }: CollectionFormData) => {
    await editCollection({ variables: { description, id, name } });
    handleClose();
    await refetch();
  };
  return (
    <>
      <TableActions>
        {(onClose) => [
          {
            text: t('delete'),
            onClick: async () => {
              await deleteCollection({ variables: { id } });
              onClose();
              await refetch();
            },
          },
          <MenuItem
            key="edit"
            onClick={() => {
              onClose();
              handleOpen();
            }}
          >
            {t('edit')}
          </MenuItem>,
        ]}
      </TableActions>
      <CollectionForm afterSubmit={onSubmit} handleClose={handleClose} open={open} initialValues={data} />
    </>
  );
}
