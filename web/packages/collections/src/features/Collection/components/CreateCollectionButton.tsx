import { Button } from '@mui/material';
import { useI18n } from 'i18n';
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
  const t = useI18n();
  return (
    <>
      <Button color="primary" size="large" variant="contained" onClick={handleOpen}>
        {t('add_collection')}
      </Button>
      <CollectionForm handleClose={handleClose} open={open} afterSubmit={afterSubmit} />
    </>
  );
}
