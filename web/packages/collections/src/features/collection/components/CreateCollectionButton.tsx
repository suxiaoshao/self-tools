import { attemptWrite } from 'custom-graphql';
import { collectionResult } from '@collections/features/collection/model/results';
import { useI18n } from 'i18n';
import { useDialog } from 'hooks';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { CreateCollectionDocument as CreateCollection } from '@collections/gql/graphql';
import { useMutation } from '@apollo/client/react';
import { Dialog, DialogTrigger } from 'ui/components/dialog';
import { Button } from 'ui/components/button';

interface CreateCollectButtonProps {
  parentId: number | null;
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateCollectionButton({ refetch, parentId }: CreateCollectButtonProps) {
  const [createCollection] = useMutation(CreateCollection);

  const afterSubmit = async ({ name, description }: CollectionFormData) => {
    const result = await attemptWrite(
      () => createCollection({ variables: { name, parentId, description } }),
      (response) => collectionResult(response.data?.createCollection),
    );
    if (result.status === 'saved')
      void Promise.resolve()
        .then(refetch)
        .catch(() => undefined);
    return result;
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
