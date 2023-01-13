import { Button } from '@mui/material';
import { useCreateItemMutation } from '../../../graphql';
import ItemForm, { ItemFormData } from '../../Item/Components/ItemForm';
import useDialog from '../../../hooks/useDialog';

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

  return (
    <>
      <Button color="secondary" sx={{ ml: 2 }} size="large" variant="contained" onClick={handleOpen}>
        添加项目
      </Button>
      <ItemForm afterSubmit={afterSubmit} open={open} handleClose={handleClose} />
    </>
  );
}
