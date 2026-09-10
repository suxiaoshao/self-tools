import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { lazy } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { Sidebar, SidebarProvider } from 'ui/components/sidebar';
import { PageToolbar } from 'ui/page-toolbar';
import RouteBoundary from './RouteBoundary';

vi.mock('i18n', () => ({ useI18n: () => (key: string) => key }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each(['pending', 'failed'])('keeps navigation available in the %s route fallback', async (state) => {
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    matches: true,
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
  }));
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  let reject!: (error: Error) => void;
  const Page = lazy(
    () =>
      new Promise<{ default: () => null }>((_resolve, onReject) => {
        reject = onReject;
      }),
  );
  render(
    <MemoryRouter>
      <SidebarProvider>
        <Sidebar>
          <Link to="/other">Other page</Link>
        </Sidebar>
        <Routes>
          <Route
            path="/"
            element={
              <RouteBoundary>
                <Page />
              </RouteBoundary>
            }
          />
          <Route
            path="/other"
            element={
              <PageToolbar>
                <h1>Other page</h1>
              </PageToolbar>
            }
          />
        </Routes>
      </SidebarProvider>
    </MemoryRouter>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('loading');
  if (state === 'failed') {
    await act(async () => reject(new Error('route-chunk-test')));
  }
  expect(await screen.findByRole(state === 'failed' ? 'alert' : 'status')).toHaveTextContent(
    state === 'failed' ? 'route_load_failed' : 'loading',
  );
  expect(screen.queryByRole('button', { name: 'reload_page' })?.matches(':enabled')).toBe(
    state === 'failed' ? true : undefined,
  );
  expect(consoleError.mock.calls.flat().join(' ').includes('route-chunk-test')).toBe(state === 'failed');
  const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
  fireEvent.click(trigger);
  expect(await screen.findByRole('dialog', { name: 'Sidebar' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Other page' }));
  expect(await screen.findByRole('heading', { name: 'Other page', hidden: true })).toBeInTheDocument();
});
