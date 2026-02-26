import { useI18n } from 'i18n';
import useDialog from '@collections/hooks/useDialog';
import useParentId from '../hooks/useParentId';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';
import { Dialog, DialogTrigger } from '@portal/components/ui/dialog';
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

  const [createCollection] = useMutation(CreateCollection);

  const afterSubmit = async ({ name, description }: CollectionFormData) => {
    await createCollection({ variables: { name, parentId, description } });
    refetch();
  };
  const { open, handleClose, handleOpenChange } = useDialog();
  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>{t('add_collection')}</DialogTrigger>
      <CollectionForm handleClose={handleClose} afterSubmit={afterSubmit} />
    </Dialog>
  );
}
