import { Button, type SxProps, type Theme } from '@mui/material';
import ItemForm, { type ItemFormData } from '../../Item/Components/ItemForm';
import useDialog from '@collections/hooks/useDialog';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';

const CreateItem = graphql(`
  mutation createItem($collectionIds: [Int!]!, $name: String!, $content: String!) {
    createItem(collectionIds: $collectionIds, name: $name, content: $content) {
      name
    }
  }
`);

export interface CreateItemButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionIds: number[];
  sx?: SxProps<Theme>;
}

export default function CreateItemButton({ refetch, collectionIds, sx }: CreateItemButtonProps) {
  const [createItem] = useMutation(CreateItem);

  const afterSubmit = async ({ name, content, collectionIds }: ItemFormData) => {
    await createItem({ variables: { name, collectionIds, content } });
    refetch();
  };
  const { open, handleClose, handleOpen } = useDialog();
  const t = useI18n();

  return (
    <>
      <Button color="secondary" sx={sx} size="large" variant="contained" onClick={handleOpen}>
        {t('add_item')}
      </Button>
      <ItemForm
        mode="create"
        afterSubmit={afterSubmit}
        open={open}
        handleClose={handleClose}
        initialValues={{ content: '', name: '', collectionIds }}
      />
    </>
  );
}
