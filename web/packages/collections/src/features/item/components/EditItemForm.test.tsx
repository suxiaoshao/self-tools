import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ApolloProvider } from '@apollo/client/react';
import { Dialog } from 'ui/components/dialog';
import { clearAuthenticatedState, getClient } from 'custom-graphql';
import EditItemForm from './EditItemForm';

vi.mock('i18n', () => ({ useI18n: () => (key: string) => key }));
vi.mock('edit/form', () => ({
  default: ({ value, onChange, readOnly }: { value: string; onChange: (value: string) => void; readOnly: boolean }) => (
    <textarea aria-label="body" value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('markdown', () => ({ default: () => null }));
vi.mock('@collections/entities/collection', () => ({
  CollectionMultiSelect: () => {
    throw new Error('Edit must not load memberships');
  },
}));
afterEach(() => {
  cleanup();
  clearAuthenticatedState();
  vi.unstubAllGlobals();
});

it('waits for required content, retries reads, and saves content independently of memberships and refresh', async () => {
  const pending: ((value: Response) => void)[] = [];
  const fetchMock = vi.fn<typeof fetch>(
    () =>
      new Promise<Response>((resolve) => {
        pending.push(resolve);
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  const close = vi.fn<() => void>();
  const refresh = vi.fn<() => Promise<void>>(async () => {
    throw new Error('refresh failed');
  });
  const client = getClient('/api/collections/graphql');
  render(
    <ApolloProvider client={client}>
      <Dialog open>
        <EditItemForm id={7} handleClose={close} refresh={refresh} />
      </Dialog>
    </ApolloProvider>,
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  const reply = (body: unknown) =>
    new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
  await act(async () =>
    pending[0](
      reply({
        data: { getItem: null },
        errors: [
          {
            message: 'private database failure',
            path: ['getItem'],
            extensions: { code: 'INTERNAL', requestId: 'a'.repeat(32) },
          },
        ],
      }),
    ),
  );
  await waitFor(() => expect(screen.getByText('refresh')).toBeInTheDocument());
  expect(screen.queryByText('submit')).not.toBeInTheDocument();
  expect(screen.queryByText('private database failure')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('refresh'));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  await act(async () =>
    pending[1](reply({ data: { getItem: { __typename: 'Item', id: 7, name: 'old', content: 'body' } } })),
  );
  fireEvent.change(await screen.findByDisplayValue('old'), { target: { value: 'new' } });
  fireEvent.click(screen.getByText('submit'));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  const calls = fetchMock.mock.calls;
  const read = JSON.parse(calls[0][1]?.body as string);
  expect(read.query).not.toContain('collections');
  const write = JSON.parse(calls[2][1]?.body as string);
  expect(write.variables).toEqual({ id: 7, name: 'new', content: 'body' });
  await act(async () => pending[2](reply({ data: { updateItem: { __typename: 'ItemSaved', itemId: 7 } } })));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(refresh).toHaveBeenCalledTimes(1);
});
