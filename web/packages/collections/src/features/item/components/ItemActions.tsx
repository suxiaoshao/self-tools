import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
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
  name,
  refetch,
  editable = false,
}: {
  id: number;
  name?: string;
  refetch: () => unknown;
  editable?: boolean;
}) {
  const { open, handleOpen, handleClose, handleOpenChange } = useDialog();
  const client = useApolloClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string }>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const action = useWriteAction();
  const t = useI18n();
  const [remove] = useMutation(DeleteItem);
  return (
    <>
      <TableActions triggerId={`item-actions-${id}`}>
        {() => [
          {
            text: t('delete'),
            disabled: action.pending,
            onClick: () => {
              if (!action.blocked) setDeleteTarget({ id, name: name ?? `${t('item')} #${id}` });
              setConfirmOpen(true);
            },
          },
          ...(editable
            ? [
                <DropdownMenuItem key="edit" disabled={action.blocked} onClick={handleOpen}>
                  {t('edit')}
                </DropdownMenuItem>,
              ]
            : []),
        ]}
      </TableActions>
      <ConfirmationDialog
        returnFocus={() => document.getElementById(`item-actions-${deleteTarget?.id}`)}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('delete_target', { name: deleteTarget?.name })}
        description={t('delete_item_impact')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        pending={action.pending}
        confirmDisabled={action.blocked}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const { id } = deleteTarget;
          const result = await action.run(() =>
            attemptWrite(
              () => remove({ variables: { id } }),
              (response) => deleteResult(response.data?.deleteItem),
            ),
          );
          if (result?.status === 'saved') {
            setConfirmOpen(false);
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
          }
        }}
        notice={
          <WriteNotice
            outcome={action.outcome}
            pending={action.pending}
            check={async () => {
              if (deleteTarget && (await action.check(() => checkDeleted(client, deleteTarget.id)))) {
                setConfirmOpen(false);
                void Promise.resolve()
                  .then(refetch)
                  .catch(() => undefined);
              }
            }}
          />
        }
      />
      {editable && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          {open && <EditItemForm key={id} id={id} handleClose={handleClose} refresh={refetch} />}
        </Dialog>
      )}
    </>
  );
}
