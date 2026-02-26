import ItemForm, { type ItemFormData } from '../../Item/Components/ItemForm';
import useDialog from '@collections/hooks/useDialog';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';
import { Dialog } from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import type { ComponentProps } from 'react';

const CreateItem = graphql(`
  mutation createItem($collectionIds: [Int!]!, $name: String!, $content: String!) {
    createItem(collectionIds: $collectionIds, name: $name, content: $content) {
      name
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

  const afterSubmit = async ({ name, content, collectionIds }: ItemFormData) => {
    await createItem({ variables: { name, collectionIds, content } });
    refetch();
  };
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
  const t = useI18n();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="secondary" className={className} onClick={handleOpen} {...props}>
        {t('add_item')}
      </Button>
      <ItemForm
        mode="create"
        afterSubmit={afterSubmit}
        handleClose={handleClose}
        initialValues={{ content: '', name: '', collectionIds }}
      />
    </Dialog>
  );
}
