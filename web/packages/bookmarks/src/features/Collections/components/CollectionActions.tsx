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

type CollectionActionsProps = CollectionTableData & {
  refetch: () => Promise<void>;
};

export default function CollectionActions({ id, refetch, ...data }: CollectionActionsProps) {
  const [deleteCollection] = useMutation(DeleteCollection);
  const [editCollection] = useMutation(UpdateCollection);
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
  const t = useI18n();
  const onSubmit = async ({ name, description }: CollectionFormData) => {
    await editCollection({ variables: { description, id, name } });
    handleClose();
    await refetch();
  };
  return (
    <>
      <TableActions>
        {() => [
          {
            text: t('delete'),
            onClick: async () => {
              await deleteCollection({ variables: { id } });
              await refetch();
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
      <CollectionForm afterSubmit={onSubmit} onOpenChange={handleOpenChange} open={open} initialValues={data} />
    </>
  );
}
