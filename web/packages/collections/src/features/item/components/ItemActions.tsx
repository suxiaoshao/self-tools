import { attemptWrite, useWriteAction, WriteNotice } from 'custom-graphql';
import { deleteResult } from '@collections/results';
import { checkDeleted } from '@collections/features/item/model/reconcile';
import { TableActions } from 'custom-table';
import { useI18n } from 'i18n';
import { useDialog } from 'hooks';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { DropdownMenuItem } from 'ui/components/dropdown-menu';
import { Dialog } from 'ui/components/dialog';
import EditItemForm from './EditItemForm';
import { DeleteItem } from '../model/operations';

export default function ItemActions({
  id,
  refetch,
  editable = false,
}: {
  id: number;
  refetch: () => unknown;
  editable?: boolean;
}) {
  const { open, handleOpen, handleClose, handleOpenChange } = useDialog();
  const client = useApolloClient();
  const action = useWriteAction();
  const t = useI18n();
  const [remove] = useMutation(DeleteItem);
  return (
    <>
      <TableActions>
        {() => [
          {
            text: t('delete'),
            onClick: async () => {
              const result = await action.run(() =>
                attemptWrite(
                  () => remove({ variables: { id } }),
                  (response) => deleteResult(response.data?.deleteItem),
                ),
              );
              if (result?.status === 'saved')
                void Promise.resolve()
                  .then(refetch)
                  .catch(() => undefined);
            },
          },
          ...(editable
            ? [
                <DropdownMenuItem key="edit" onClick={handleOpen}>
                  {t('edit')}
                </DropdownMenuItem>,
              ]
            : []),
        ]}
      </TableActions>
      <WriteNotice
        outcome={action.outcome}
        pending={action.pending}
        check={async () => {
          if (await action.check(() => checkDeleted(client, id)))
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
        }}
      />
      {editable && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          {open && <EditItemForm key={id} id={id} handleClose={handleClose} refresh={refetch} />}
        </Dialog>
      )}
    </>
  );
}
