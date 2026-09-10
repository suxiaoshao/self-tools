import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ApolloProvider } from '@apollo/client/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { clearAuthenticatedState, getClient } from 'custom-graphql';
import Collections from './view';
import { CollectionsProvider, CollectionLoadingState, useAllCollection } from '../../entities/collection';

vi.mock('i18n', () => ({ useI18n: () => (key: string) => key }));

afterEach(() => {
  cleanup();
  clearAuthenticatedState();
  vi.unstubAllGlobals();
});

function SharedCollectionOptions() {
  const { value } = useAllCollection();
  return (
    <select aria-label="collection">
      {value.tag === CollectionLoadingState.state &&
        [...value.value.values()].map(({ id, path }) => (
          <option key={id} value={id}>
            {path}
          </option>
        ))}
    </select>
  );
}

it('refreshes both the page and shared collection options after creation, without remounting the provider', async () => {
  const collection = {
    __typename: 'Collection',
    id: 7,
    name: 'new collection',
    path: '/new collection/',
    parentId: null,
    description: null,
    createTime: '2026-09-09T00:00:00Z',
    updateTime: '2026-09-09T00:00:00Z',
  };
  let created = false;
  const operations: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(async (_input, init) => {
      const { operationName } = JSON.parse(init?.body as string);
      operations.push(operationName);
      let data: unknown;
      switch (operationName) {
        case 'allCollections':
          data = { allCollections: created ? [collection] : [] };
          break;
        case 'getCollections':
          data = { getCollections: { data: created ? [collection] : [], total: created ? 1 : 0 } };
          break;
        case 'createCollection':
          created = true;
          data = { createCollection: { __typename: 'CollectionSaved', collectionId: collection.id } };
          break;
        default:
          throw new Error(`Unexpected operation: ${operationName}`);
      }
      return new Response(JSON.stringify({ data }), { headers: { 'content-type': 'application/json' } });
    }),
  );
  render(
    <ApolloProvider client={getClient('/api/bookmarks/graphql')}>
      <MemoryRouter>
        <CollectionsProvider>
          <Link to="/selector">open selector</Link>
          <Routes>
            <Route path="/" element={<Collections />} />
            <Route path="/selector" element={<SharedCollectionOptions />} />
          </Routes>
        </CollectionsProvider>
      </MemoryRouter>
    </ApolloProvider>,
  );
  await waitFor(() => expect(operations).toContain('allCollections'));
  fireEvent.click(screen.getByRole('button', { name: 'add_collection' }));
  fireEvent.change((await screen.findByRole('dialog')).querySelector('input[name="name"]')!, {
    target: { value: collection.name },
  });
  fireEvent.click(screen.getByRole('button', { name: 'submit' }));
  await screen.findByRole('link', { name: collection.name });
  fireEvent.click(screen.getByRole('link', { name: 'open selector' }));
  expect(await screen.findByRole('option', { name: collection.path })).toHaveValue('7');
  expect(operations.filter((operation) => operation === 'createCollection')).toHaveLength(1);
  expect(operations.filter((operation) => operation === 'getCollections')).toHaveLength(2);
  expect(operations.filter((operation) => operation === 'allCollections')).toHaveLength(2);
});
