import { CollectionAndItem } from '../hooks/useTableColumns';
import { TableActions } from 'custom-table';
import { useDeleteCollectionMutation, useDeleteItemMutation } from '../../../graphql';

export type TableActionsProps = CollectionAndItem & {
  refetch: () => void;
};

export default function Actions({ id, refetch, __typename }: TableActionsProps) {
  const [deleteCollection] = useDeleteCollectionMutation();
  const [deleteItem] = useDeleteItemMutation();

  return (
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
      ]}
    </TableActions>
  );
}
