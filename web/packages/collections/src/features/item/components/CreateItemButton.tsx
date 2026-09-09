import { attemptWrite } from 'custom-graphql';
import { itemResult } from '@collections/features/item/model/results';
import ItemForm, { type ItemCreateData } from './ItemForm';
import { useDialog } from 'hooks';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql/index';
import { useMutation } from '@apollo/client/react';
import { Dialog } from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import type { ComponentProps } from 'react';

const CreateItem = graphql(`
  mutation createItem($collectionIds: [Int!]!, $name: String!, $content: String!) {
    createItem(collectionIds: $collectionIds, name: $name, content: $content) {
      __typename
      ... on ItemSaved {
        itemId
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
    }
  }
`);

interface CreateItemButtonProps extends ComponentProps<typeof Button> {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionIds: number[];
  className?: string;
}

export default function CreateItemButton({ refetch, collectionIds, className, ...props }: CreateItemButtonProps) {
  const [createItem] = useMutation(CreateItem);

  const afterSubmit = async ({ name, content, collectionIds }: ItemCreateData) => {
    const result = await attemptWrite(
      () => createItem({ variables: { name, collectionIds, content } }),
      (response) => itemResult(response.data?.createItem),
    );
    if (result.status === 'saved')
      void Promise.resolve()
        .then(refetch)
        .catch(() => undefined);
    return result;
  };
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
  const t = useI18n();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="secondary" className={className} onClick={handleOpen} {...props}>
        {t('add_item')}
      </Button>
      {open && (
        <ItemForm
          mode="create"
          afterSubmit={afterSubmit}
          handleClose={handleClose}
          initialValues={{ content: '', name: '', collectionIds }}
        />
      )}
    </Dialog>
  );
}
