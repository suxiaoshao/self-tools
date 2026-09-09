import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
import { attemptWrite, RequestNotice } from 'custom-graphql';
import { useI18n } from 'i18n';
import { graphql } from '@collections/gql';
import { itemResult } from '@collections/results';
import { checkItem } from '@collections/reconcile';
import { DialogContent, DialogHeader, DialogTitle } from '@portal/components/ui/dialog';
import { Spinner } from '@portal/components/ui/spinner';
import ItemForm, { type ItemEditData } from './ItemForm';

const GetEditItem = graphql(`
  query getEditItem($id: Int!) {
    getItem(id: $id) {
      id
      name
      content
    }
  }
`);

const UpdateItem = graphql(`
  mutation updateItem($id: Int!, $name: String!, $content: String!) {
    updateItem(id: $id, name: $name, content: $content) {
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

/** Both entry points create an isolated read and draft for each open dialog. */
export default function EditItemForm({
  id,
  handleClose,
  refresh,
}: {
  id: number;
  handleClose: () => void;
  refresh: () => unknown;
}) {
  const client = useApolloClient();
  const t = useI18n();
  const { data, loading, error, refetch } = useQuery(GetEditItem, {
    variables: { id },
    fetchPolicy: 'no-cache',
    context: { queryDeduplication: false },
  });
  const [updateItem] = useMutation(UpdateItem);
  const afterSubmit = async ({ name, content }: ItemEditData) => {
    const result = await attemptWrite(
      () => updateItem({ variables: { id, name, content } }),
      (response) => itemResult(response.data?.updateItem),
    );
    if (result.status === 'saved')
      void Promise.resolve()
        .then(refresh)
        .catch(() => undefined);
    return result;
  };
  if (loading || error || !data?.getItem || data.getItem.id !== id) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('modify_item')}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <Spinner />
        ) : error ? (
          <RequestNotice error={error} retry={refetch} />
        ) : (
          <p>{t('request_not_found')}</p>
        )}
      </DialogContent>
    );
  }
  return (
    <ItemForm
      mode="edit"
      initialValues={data.getItem}
      afterSubmit={afterSubmit}
      handleClose={handleClose}
      checkResult={async (snapshot) => {
        const confirmed = await checkItem(client, id, snapshot);
        if (confirmed)
          void Promise.resolve()
            .then(refresh)
            .catch(() => undefined);
        return confirmed;
      }}
    />
  );
}
