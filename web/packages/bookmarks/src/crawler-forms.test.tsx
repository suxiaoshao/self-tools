import { SidebarProvider } from 'ui/components/sidebar';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApolloProvider } from '@apollo/client/react';
import { MemoryRouter } from 'react-router';
import { clearAuthenticatedState, getClient } from 'custom-graphql';
import { AuthorFetch } from './features/author';
import { NovelFetch } from './features/novel';

vi.mock('i18n', () => ({
  useI18n: () => (key: string) =>
    (({ qidian: '起点中文网', jjwxc: '晋江文学城' }) as Record<string, string>)[key] ?? key,
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    matches: false,
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
  }));
});

afterEach(() => {
  cleanup();
  clearAuthenticatedState();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each([
  ['author', AuthorFetch],
  ['novel', NovelFetch],
] as const)('%s crawler preserves required selection, labels and enum variables', async (kind, Form) => {
  const consoleError = vi.spyOn(console, 'error');
  const fetchMock = vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify({ data: { [kind === 'author' ? 'fetchAuthor' : 'fetchNovel']: null } }), {
        headers: { 'content-type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  render(
    <ApolloProvider client={getClient('/api/bookmarks/graphql')}>
      <MemoryRouter>
        <SidebarProvider>
          <Suspense fallback={null}>
            <Form />
          </Suspense>
        </SidebarProvider>
      </MemoryRouter>
    </ApolloProvider>,
  );
  await act(() => vi.dynamicImportSettled());
  fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByText('request_required')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: `${kind}_id` }), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: 'fetch' }));
  expect(await screen.findByText('request_required')).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();

  const select = screen.getByRole('combobox', { name: 'novel_site' });
  for (const [label, value] of [
    ['起点中文网', 'QIDIAN'],
    ['晋江文学城', 'JJWXC'],
  ] as const) {
    fireEvent.click(select);
    fireEvent.keyDown(await screen.findByRole('option', { name: label }), { key: 'Enter' });
    await waitFor(() => expect(select).toHaveTextContent(label));
    fireEvent.click(screen.getByRole('button', { name: 'fetch' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(value === 'QIDIAN' ? 1 : 2));
    const [, init] = fetchMock.mock.calls.at(-1)!;
    expect(JSON.parse(init?.body as string).variables).toEqual({ id: '123', novelSite: value });
    await waitFor(() => expect(screen.getByRole('button', { name: 'fetch' })).toBeEnabled());
  }
  expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/uncontrolled.*controlled/);
});
