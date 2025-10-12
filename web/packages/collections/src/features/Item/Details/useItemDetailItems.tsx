import type { GetItemQuery } from '@collections/gql/graphql';
import { useI18n } from 'i18n';
import type { DetailsItem } from 'details';
import { useMemo } from 'react';
import { match, P } from 'ts-pattern';
import { Box, Chip, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';
import AddCollection from './components/AddCollection';
import { format } from 'time';
import CustomMarkdown from '@collections/components/Markdown';

const DeleteCollectionForItem = graphql(`
  mutation deleteCollectionForItem($collectionId: Int!, $itemId: Int!) {
    deleteCollectionForItem(collectionId: $collectionId, itemId: $itemId) {
      id
    }
  }
`);

export default function useItemDetailItems(data: GetItemQuery | undefined, refetch: () => void) {
  const navigate = useNavigate();
  const t = useI18n();
  const [deleteCollectionForItem] = useMutation(DeleteCollectionForItem);

  const items = useMemo<DetailsItem[]>(
    () =>
      match(data?.getItem)
        .with(
          P.nonNullable,
          (data) =>
            [
              { label: t('create_time'), value: format(data.createTime), span: 2 },
              { label: t('update_time'), value: format(data.updateTime), span: 2 },
              {
                label: t('collections'),
                value: (
                  <Box sx={{ gap: 1, display: 'flex' }}>
                    {data.collections.map(({ id, name, path }) => (
                      <Tooltip title={path} key={id}>
                        <Chip
                          color="primary"
                          variant="outlined"
                          label={name}
                          onClick={() => {
                            navigate(`/bookmarks/collections?parentId=${id}`);
                          }}
                          onDelete={async () => {
                            await deleteCollectionForItem({ variables: { collectionId: id, itemId: data.id } });
                            refetch();
                          }}
                        />
                      </Tooltip>
                    ))}
                    <AddCollection itemId={data.id} refetch={refetch} />
                  </Box>
                ),
                span: 4,
              },
              {
                label: t('content'),
                value: <CustomMarkdown value={data.content} />,
                span: 4,
              },
            ] satisfies DetailsItem[],
        )
        .otherwise(() => []),
    [data, t, deleteCollectionForItem, navigate, refetch],
  );
  return items;
}
