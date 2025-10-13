import { useMutation, useQuery } from '@apollo/client/react';
import { graphql } from '@collections/gql';
import { Delete, Edit, KeyboardArrowLeft, Refresh } from '@mui/icons-material';
import { Box, Card, CardContent, CardHeader, IconButton, Skeleton } from '@mui/material';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Details } from 'details';
import { useI18n } from 'i18n';
import useItemDetailItems from './useItemDetailItems';
import useTitle from '@bookmarks/hooks/useTitle';
import useDialog from '@collections/hooks/useDialog';
import ItemForm, { type ItemFormData } from '../Components/ItemForm';
import { DeleteItem, UpdateItem } from '@collections/features/Collection/components/Actions';

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
  // fetch data
  const { itemId } = useParams();
  const { data, loading, refetch } = useQuery(GetItem, { variables: { id: Number(itemId) } });

  // title
  const t = useI18n();
  useTitle(t('item_detail_title', { itemName: data?.getItem?.name }));
  const navigate = useNavigate();
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const items = useItemDetailItems(data, handleRefresh);
  const { open, handleClose, handleOpen } = useDialog();
  const [updateItem] = useMutation(UpdateItem);
  const itemAfterSubmit = async ({ name, content }: ItemFormData) => {
    await updateItem({ variables: { id: Number(itemId), name, content } });
    refetch();
  };
  const [deleteItem] = useMutation(DeleteItem);
  const handleDelete = async () => {
    await deleteItem({ variables: { id: Number(itemId) } });
    navigate(-1);
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', width: '100%', pl: 2, pr: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <KeyboardArrowLeft />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleRefresh}>
          <Refresh />
        </IconButton>
      </Box>
      <Box sx={{ flex: '1 1 0', overflow: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data?.getItem && (
            <Card>
              <CardHeader
                title={data.getItem.name}
                action={
                  <>
                    <IconButton onClick={handleOpen}>
                      <Edit />
                    </IconButton>
                    <ItemForm
                      loading={loading}
                      initialValues={{
                        collectionIds: data.getItem.collections.map(({ id }) => id),
                        content: data.getItem.content,
                        name: data.getItem.name,
                      }}
                      mode="edit"
                      open={open}
                      handleClose={handleClose}
                      afterSubmit={itemAfterSubmit}
                    />
                    <IconButton onClick={handleDelete}>
                      <Delete />
                    </IconButton>
                  </>
                }
              />
              <CardContent>
                <Details items={items} sx={{ gap: 1 }} fullSpan={4} />
              </CardContent>
            </Card>
          )}
          {loading && (
            <Card>
              <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="rectangular" width={210} height={60} />
              <Skeleton variant="rounded" width={210} height={60} />
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
