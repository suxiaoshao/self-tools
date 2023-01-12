import { CollectionAndItem } from '../hooks/useTableColumns';
import { TableActions } from 'custom-table';
import { useDeleteCollectionMutation, useDeleteItemMutation, useUpdateCollectionMutation } from '../../../graphql';
import useDialog from '../../../hooks/useDialog';
import { MenuItem } from '@mui/material';
import CollectionForm, { CollectionFormData } from './CollectionForm';

export type TableActionsProps = CollectionAndItem & {
  refetch: () => void;
};

export default function Actions({ id, refetch, __typename, ...data }: TableActionsProps) {
  const [deleteCollection] = useDeleteCollectionMutation();
  const [deleteItem] = useDeleteItemMutation();
  const [updateCollection] = useUpdateCollectionMutation();
  const { open, handleClose, handleOpen } = useDialog();
  const collectionAfterSubmit = async ({ name, description }: CollectionFormData) => {
    await updateCollection({ variables: { id, name, description } });
    refetch();
  };

  return (
    <>
      <TableActions>
        {(onClose) => [
          {
            text: '删除',
            onClick: async () => {
              if (__typename === 'Collection') {
                await deleteCollection({ variables: { id } });
              } else {
                await deleteItem({ variables: { id } });
              }
              onClose();
              await refetch();
            },
          },
          __typename === 'Collection' ? (
            <>
              <MenuItem
                onClick={() => {
                  onClose();
                  handleOpen();
                }}
              >
                编辑
              </MenuItem>
            </>
          ) : (
            <></>
          ),
        ]}
      </TableActions>
      <CollectionForm
        mode="edit"
        initialValues={data}
        open={open}
        handleClose={handleClose}
        afterSubmit={collectionAfterSubmit}
      />
    </>
  );
}
