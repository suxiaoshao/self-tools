import { Button } from '@mui/material';
import { useI18n } from 'i18n';
import { useState } from 'react';
import { useAllCollection } from '../collectionSlice';
import useParentId from './useParentId';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@bookmarks/gql';
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
  const { fetchData } = useAllCollection();

  const [createCollection] = useMutation(CreateCollection);

  const onSubmit = async ({ name, description }: CollectionFormData) => {
    await createCollection({ variables: { name, parentId, description } });
    refetch();
    handleClose();
    await fetchData();
  };
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const t = useI18n();
  return (
    <>
      <Button color="primary" size="large" variant="contained" onClick={() => setOpen(true)}>
        {t('add_collection')}
      </Button>
      <CollectionForm afterSubmit={onSubmit} handleClose={handleClose} open={open} />
    </>
  );
}
