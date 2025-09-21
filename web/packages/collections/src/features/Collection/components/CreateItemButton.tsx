import { Button } from '@mui/material';
import ItemForm, { type ItemFormData } from '../../Item/Components/ItemForm';
import useDialog from '@collections/hooks/useDialog';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';

const CreateItem = graphql(`
  mutation createItem($collectionId: Int!, $name: String!, $content: String!) {
    createItem(collectionId: $collectionId, name: $name, content: $content) {
      name
    }
  }
`);

export interface CreateItemButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId: number;
}

export default function CreateItemButton({ refetch, collectionId }: CreateItemButtonProps) {
  const [createItem] = useMutation(CreateItem);

  const afterSubmit = async ({ name, content }: ItemFormData) => {
    await createItem({ variables: { name, collectionId, content } });
    refetch();
  };
  const { open, handleClose, handleOpen } = useDialog();
  const t = useI18n();

  return (
    <>
      <Button color="secondary" sx={{ ml: 2 }} size="large" variant="contained" onClick={handleOpen}>
        {t('add_item')}
      </Button>
      <ItemForm
        mode="create"
        afterSubmit={afterSubmit}
        open={open}
        handleClose={handleClose}
        initialValues={{ content: '', name: '' }}
      />
    </>
  );
}
