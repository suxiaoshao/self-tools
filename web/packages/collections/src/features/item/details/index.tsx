import { PageToolbar } from 'ui/page-toolbar';
import { ConfirmationDialog } from 'ui/confirmation-dialog';
import { useState } from 'react';
import { attemptWrite, useWriteAction, WriteNotice, RequestNotice } from 'custom-graphql';
import { deleteResult } from '@collections/results';
import { checkDeleted } from '@collections/features/item/model/reconcile';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '@collections/gql/index';
import { Delete, Edit, RefreshCcw, ChevronLeft } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Details } from 'details';
import { useI18n } from 'i18n';
import useItemDetailItems from './useItemDetailItems';
import { useTitle } from 'hooks';
import { useDialog } from 'hooks';
import EditItemForm from '../components/EditItemForm';
import { DeleteItem } from '../model/operations';
import { Dialog } from 'ui/components/dialog';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from 'ui/components/card';
import { Skeleton } from 'ui/components/skeleton';
import { Button } from 'ui/components/button';

const GetItem = graphql(`
  query getItem($id: Int!) {
    getItem(id: $id) {
      id
      name
      content
      createTime
      updateTime
      collections {
        id
        name
        path
        description
      }
    }
  }
`);

export default function ItemDetails() {
  const client = useApolloClient();
  const deletion = useWriteAction();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<{ id: number; name: string }>();
  // fetch data
  const { itemId } = useParams();
  const { data, loading, refetch, error } = useQuery(GetItem, { variables: { id: Number(itemId) } });

  // title
  const t = useI18n();
  useTitle(t('item_detail_title', { itemName: data?.getItem?.name }));
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    void refetch().catch(() => undefined);
  }, [refetch]);
  const items = useItemDetailItems(data, handleRefresh, error);
  const { open, handleClose, handleOpen, handleOpenChange } = useDialog();
  const [deleteItem] = useMutation(DeleteItem);
  const handleDelete = async () => {
    if (!target) return;
    const result = await deletion.run(() =>
      attemptWrite(
        () => deleteItem({ variables: { id: target.id } }),
        (response) => deleteResult(response.data?.deleteItem),
      ),
    );
    if (result?.status === 'saved') navigate(-1);
  };
  return (
    <div className="flex min-h-0 size-full flex-col">
      <PageToolbar>
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          onClick={() => navigate(-1)}
          aria-label={t('back')}
        >
          <ChevronLeft />
        </Button>
        <div className="grow" />
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full"
          onClick={handleRefresh}
          aria-label={t('refresh')}
        >
          <RefreshCcw />
        </Button>
      </PageToolbar>
      <div className="flex min-h-0 flex-1 flex-col pb-2">
        <RequestNotice error={error} retry={refetch} />
        <ConfirmationDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('delete_target', { name: target?.name })}
          description={t('delete_item_impact')}
          confirmLabel={t('delete')}
          cancelLabel={t('cancel')}
          pending={deletion.pending}
          confirmDisabled={deletion.blocked}
          onConfirm={handleDelete}
          notice={
            <WriteNotice
              outcome={deletion.outcome}
              pending={deletion.pending}
              check={async () => {
                if (target && (await deletion.check(() => checkDeleted(client, target.id)))) navigate(-1);
              }}
            />
          }
        />
        {!loading && !error && data?.getItem === null && <p>{t('request_not_found')}</p>}
        <div className="flex-[1_1_0] overflow-y-auto pl-2 pr-2">
          <div className="flex flex-col gap-2">
            {data?.getItem && (
              <Card>
                <CardHeader>
                  <CardTitle>{data.getItem.name}</CardTitle>
                  <CardAction>
                    <Dialog open={open} onOpenChange={handleOpenChange}>
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        className="rounded-full"
                        disabled={deletion.blocked}
                        aria-label={t('edit')}
                        onClick={handleOpen}
                      >
                        <Edit />
                      </Button>
                      {open && (
                        <EditItemForm key={itemId} id={Number(itemId)} handleClose={handleClose} refresh={refetch} />
                      )}
                      <Button
                        variant="ghost"
                        size="icon-lg"
                        className="rounded-full"
                        disabled={deletion.pending}
                        aria-label={t('delete_target', { name: data.getItem.name })}
                        onClick={() => {
                          if (!deletion.blocked && data.getItem)
                            setTarget({ id: data.getItem.id, name: data.getItem.name });
                          setConfirmOpen(true);
                        }}
                      >
                        <Delete />
                      </Button>
                    </Dialog>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <Details items={items} className="gap-2" fullSpan={4} />
                </CardContent>
              </Card>
            )}
            {loading && (
              <Card>
                <CardContent className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
