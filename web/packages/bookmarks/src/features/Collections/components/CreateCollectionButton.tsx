import { useI18n } from 'i18n';
import { useAllCollection } from '../collectionSlice';
import useParentId from './useParentId';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';
import useDialog from '@collections/hooks/useDialog';
import { Button } from '@portal/components/ui/button';

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
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();

  const t = useI18n();
  return (
    <>
      <Button onClick={handleOpen}>{t('add_collection')}</Button>
      <CollectionForm afterSubmit={onSubmit} onOpenChange={handleOpenChange} open={open} />
    </>
  );
}
