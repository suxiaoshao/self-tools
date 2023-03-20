import { CollectionAndItem } from '../hooks/useTableColumns';
import { TableActions } from 'custom-table';
import {
  useDeleteCollectionMutation,
  useDeleteItemMutation,
  useGetEditItemLazyQuery,
  useUpdateCollectionMutation,
  useUpdateItemMutation,
} from '../../../graphql';
import useDialog from '../../../hooks/useDialog';
import { MenuItem } from '@mui/material';
import CollectionForm, { CollectionFormData } from './CollectionForm';
import ItemForm, { ItemFormData } from '../../Item/Components/ItemForm';
import { useI18n } from 'i18n';

export type TableActionsProps = CollectionAndItem & {
  refetch: () => void;
};

export default function Actions({ id, refetch, __typename, ...data }: TableActionsProps) {
  const [deleteCollection] = useDeleteCollectionMutation();
  const [deleteItem] = useDeleteItemMutation();
  const [updateCollection] = useUpdateCollectionMutation();
  const [updateItem] = useUpdateItemMutation();
  const [fetchItem, { loading, data: editItemData }] = useGetEditItemLazyQuery();
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
              await refetch();
            },
          },
          <MenuItem
            key={'edit'}
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
      {__typename === 'Collection' ? (
        <CollectionForm
          mode="edit"
          initialValues={data}
          open={open}
          handleClose={handleClose}
          afterSubmit={collectionAfterSubmit}
        />
      ) : (
        <ItemForm
          loading={loading}
          initialValues={editItemData?.getItem}
          mode="edit"
          open={open}
          handleClose={handleClose}
          afterSubmit={itemAfterSubmit}
        />
      )}
    </>
  );
}
