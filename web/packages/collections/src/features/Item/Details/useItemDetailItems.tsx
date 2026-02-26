import type { GetItemQuery } from '@collections/gql/graphql';
import { useI18n } from 'i18n';
import type { DetailsItem } from 'details';
import { useMemo } from 'react';
import { match, P } from 'ts-pattern';
import { Link } from 'react-router-dom';
import { graphql } from '@collections/gql';
import { useMutation } from '@apollo/client/react';
import AddCollection from './components/AddCollection';
import { format } from 'time';
import CustomMarkdown from '@collections/components/Markdown';
import { Badge } from '@portal/components/ui/badge';
import { Button } from '@portal/components/ui/button';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';

const DeleteCollectionForItem = graphql(`
  mutation deleteCollectionForItem($collectionId: Int!, $itemId: Int!) {
    deleteCollectionForItem(collectionId: $collectionId, itemId: $itemId) {
      id
    }
  }
`);

export default function useItemDetailItems(data: GetItemQuery | undefined, refetch: () => void) {
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
                  <div className="gap-1 flex items-center ">
                    {data.collections.map(({ id, name, path }) => (
                      <Tooltip key={id}>
                        <TooltipTrigger render={<Badge variant="secondary" />}>
                          <Link to={`/collections/collections?parentId=${id}`}>{name}</Link>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="data-[state=open]:bg-muted size-6 rounded-full"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteCollectionForItem({ variables: { collectionId: id, itemId: data.id } });
                              refetch();
                            }}
                          >
                            <X />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{path}</TooltipContent>
                      </Tooltip>
                    ))}
                    <AddCollection itemId={data.id} refetch={refetch} />
                  </div>
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
    [data, t, deleteCollectionForItem, refetch],
  );
  return items;
}
