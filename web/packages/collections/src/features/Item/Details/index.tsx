import { attemptWrite, useWriteAction, WriteNotice, RequestNotice } from 'custom-graphql';
import { itemResult, deleteResult } from '@collections/results';
import { checkItem, checkDeleted } from '@collections/reconcile';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '@collections/gql';
import { Delete, Edit, RefreshCcw, ChevronLeft } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Details } from 'details';
import { useI18n } from 'i18n';
import useItemDetailItems from './useItemDetailItems';
import useTitle from '@bookmarks/hooks/useTitle';
import useDialog from '@collections/hooks/useDialog';
import ItemForm, { type ItemFormData } from '../Components/ItemForm';
import { DeleteItem, UpdateItem } from '@collections/features/Collection/components/Actions';
import { Dialog } from '@portal/components/ui/dialog';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@portal/components/ui/card';
import { Skeleton } from '@portal/components/ui/skeleton';
import { Button } from '@portal/components/ui/button';

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
  const [updateItem] = useMutation(UpdateItem);
  const itemAfterSubmit = async ({ name, content }: ItemFormData) => {
    const result = await attemptWrite(
      () => updateItem({ variables: { id: Number(itemId), name, content } }),
      (response) => itemResult(response.data?.updateItem),
    );
    if (result.status === 'saved') void refetch().catch(() => undefined);
    return result;
  };
  const [deleteItem] = useMutation(DeleteItem);
  const handleDelete = async () => {
    const result = await deletion.run(() =>
      attemptWrite(
        () => deleteItem({ variables: { id: Number(itemId) } }),
        (response) => deleteResult(response.data?.deleteItem),
      ),
    );
    if (result?.status === 'saved') navigate(-1);
  };
  return (
    <div className="flex flex-col size-full overflow-hidden pb-2">
      <div className="flex w-full pl-2 pr-2">
        <Button variant="ghost" size="icon-lg" className="rounded-full" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <div className="grow" />
        <Button variant="ghost" size="icon-lg" className="rounded-full" onClick={handleRefresh}>
          <RefreshCcw />
        </Button>
      </div>
      <RequestNotice error={error} retry={refetch} />
      <WriteNotice
        outcome={deletion.outcome}
        pending={deletion.pending}
        check={async () => {
          if (await deletion.check(() => checkDeleted(client, Number(itemId), 'Item'))) navigate(-1);
        }}
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
                      disabled={!data.getItem.collections}
                      onClick={handleOpen}
                    >
                      <Edit />
                    </Button>
                    <ItemForm
                      loading={loading}
                      initialValues={
                        data.getItem.collections
                          ? {
                              collectionIds: data.getItem.collections.map(({ id }) => id),
                              content: data.getItem.content,
                              name: data.getItem.name,
                            }
                          : undefined
                      }
                      mode="edit"
                      handleClose={handleClose}
                      afterSubmit={itemAfterSubmit}
                      checkResult={(data) => checkItem(client, Number(itemId), data)}
                    />
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      className="rounded-full"
                      disabled={deletion.blocked}
                      onClick={handleDelete}
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
  );
}
