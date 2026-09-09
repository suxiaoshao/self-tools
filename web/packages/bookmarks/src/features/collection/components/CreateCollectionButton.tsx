import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useI18n } from 'i18n';
import useParentId from './useParentId';
import CollectionForm, { type CollectionFormData } from './CollectionForm';
import { graphql } from '@bookmarks/gql/index';
import { useMutation } from '@apollo/client/react';
import { useDialog } from 'hooks';
import { Button } from 'ui/components/button';

const CreateCollection = graphql(`
  mutation createCollection($parentId: Int, $name: String!, $description: String) {
    createCollection(parentId: $parentId, name: $name, description: $description) {
      __typename
      ... on CollectionSaved {
        collectionId
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
      ... on MissingResources {
        resources {
          kind
          id
        }
      }
      ... on Conflict {
        reason
        resources {
          kind
          id
        }
      }
    }
  }
`);

interface CreateCollectButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateCollectionButton({ refetch }: CreateCollectButtonProps) {
  const write = useBookmarkWrite('/bookmarks/collections');
  const parentId = useParentId();

  const [createCollection] = useMutation(CreateCollection);

  const onSubmit = async ({ name, description }: CollectionFormData) => {
    if (
      !(await write.execute(
        async () => (await createCollection({ variables: { name, parentId, description } })).data?.createCollection,
      ))
    )
      return;
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
    handleClose();
  };
  // 控制 dialog
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();

  const t = useI18n();
  return (
    <>
      <Button onClick={handleOpen}>{t('add_collection')}</Button>
      <CollectionForm
        notice={write.notice}
        disabled={write.blocked}
        afterSubmit={onSubmit}
        onOpenChange={handleOpenChange}
        open={open}
      />
    </>
  );
}
