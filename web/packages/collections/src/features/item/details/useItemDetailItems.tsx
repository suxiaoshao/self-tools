import { RequestNotice, WriteNotice, useWriteAction, attemptWrite } from 'custom-graphql';
import { membershipResult } from '@collections/features/item/model/results';
import { checkMembership } from '@collections/features/item/model/reconcile';
import type { GetItemQuery } from '@collections/gql/graphql';
import { useI18n } from 'i18n';
import type { DetailsItem } from 'details';
import { useMemo } from 'react';
import { match, P } from 'ts-pattern';
import { Link } from 'react-router';
import { graphql } from '@collections/gql/index';
import { useApolloClient, useMutation } from '@apollo/client/react';
import AddCollection from './components/AddCollection';
import { format } from 'time';
import CustomMarkdown from 'markdown';
import { Badge } from 'ui/components/badge';
import { Button } from 'ui/components/button';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/components/tooltip';

const DeleteCollectionForItem = graphql(`
  mutation deleteCollectionForItem($collectionId: Int!, $itemId: Int!) {
    deleteCollectionForItem(collectionId: $collectionId, itemId: $itemId) {
      __typename
      ... on CollectionMembershipChanged {
        collectionId
        resource {
          kind
          id
        }
        present
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
    }
  }
`);

export default function useItemDetailItems(data: GetItemQuery | undefined, refetch: () => void, error: unknown) {
  const t = useI18n();

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
                    {data.collections === null && (
                      <div>
                        <p>{t('request_association_failed')}</p>
                        <RequestNotice error={error} retry={refetch} />
                      </div>
                    )}
                    {data.collections?.map(({ id, name, path }) => (
                      <Tooltip key={id}>
                        <TooltipTrigger render={<Badge variant="secondary" />}>
                          <Link to={`/collections/collections?parentId=${id}`}>{name}</Link>
                          <RemoveCollection collectionId={id} itemId={data.id} refetch={refetch} />
                        </TooltipTrigger>
                        <TooltipContent>{path}</TooltipContent>
                      </Tooltip>
                    ))}
                    {data.collections !== null && <AddCollection itemId={data.id} refetch={refetch} />}
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
    [data, t, refetch, error],
  );
  return items;
}

function RemoveCollection({
  collectionId,
  itemId,
  refetch,
}: {
  collectionId: number;
  itemId: number;
  refetch: () => void;
}) {
  const client = useApolloClient();
  const action = useWriteAction();
  const [remove] = useMutation(DeleteCollectionForItem);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={action.blocked}
        className="size-6 rounded-full"
        onClick={async (e) => {
          e.stopPropagation();
          const result = await action.run(() =>
            attemptWrite(
              () => remove({ variables: { collectionId, itemId } }),
              (response) => membershipResult(response.data?.deleteCollectionForItem, false),
            ),
          );
          if (result?.status === 'saved')
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
        }}
      >
        <X />
      </Button>
      <WriteNotice
        outcome={action.outcome}
        pending={action.pending}
        check={async () => {
          if (await action.check(() => checkMembership(client, itemId, collectionId, false)))
            void Promise.resolve()
              .then(refetch)
              .catch(() => undefined);
        }}
      />
    </>
  );
}
