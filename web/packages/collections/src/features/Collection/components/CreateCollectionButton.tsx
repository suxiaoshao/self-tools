import { Button } from '@mui/material';
import { useCreateCollectionMutation } from '../../../graphql';
import useDialog from '../../../hooks/useDialog';
import useParentId from '../hooks/useParentId';
import CollectionForm, { CollectionFormData } from './CollectionForm';

export interface CreateCollectButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateCollectionButton({ refetch }: CreateCollectButtonProps): JSX.Element {
  const parentId = useParentId();

  const [createCollection] = useCreateCollectionMutation();

  const afterSubmit = async ({ name, description }: CollectionFormData) => {
    await createCollection({ variables: { name, parentId, description } });
    refetch();
  };
  const { open, handleClose, handleOpen } = useDialog();
  return (
    <>
      <Button color="primary" size="large" variant="contained" onClick={handleOpen}>
        添加集合
      </Button>
      <CollectionForm handleClose={handleClose} open={open} afterSubmit={afterSubmit} />
    </>
  );
}
