import { Button } from '@mui/material';
import { useCreateItemMutation } from '../../../graphql';
import ItemForm, { ItemFormData } from '../../Item/Components/ItemForm';
import useDialog from '../../../hooks/useDialog';
import { useI18n } from 'i18n';

export interface CreateItemButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId: number;
}

export default function CreateItemButton({ refetch, collectionId }: CreateItemButtonProps): JSX.Element {
  const [createItem] = useCreateItemMutation();

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
        afterSubmit={afterSubmit}
        open={open}
        handleClose={handleClose}
        initialValues={{ content: '> 苏少好帅', name: '' }}
      />
    </>
  );
}
