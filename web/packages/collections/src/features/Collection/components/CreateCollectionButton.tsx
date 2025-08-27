import { Button } from '@mui/material';
import { useI18n } from 'i18n';
import useDialog from '../../../hooks/useDialog';
import useParentId from '../hooks/useParentId';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';

const CreateCollection = graphql(`
  mutation createCollection($parentId: Int, $name: String!, $description: String) {
    createCollection(parentId: $parentId, name: $name, description: $description) {
      path
    }
  }
`);

export interface CreateCollectButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateCollectionButton({ refetch }: CreateCollectButtonProps) {
  const parentId = useParentId();

  const [createCollection] = useMutation(CreateCollection);

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
