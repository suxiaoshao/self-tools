import { PageToolbar } from 'ui/page-toolbar';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { i18n } from 'i18n';

function Page() {
  const { pathname } = useLocation();
  return (
    <PageToolbar>
      <h1>{pathname}</h1>
    </PageToolbar>
  );
}

async function renderLayout(width = 390) {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(max-width: 767px)' && width < 768,
    media: query,
    addEventListener: vi.fn<MediaQueryList['addEventListener']>(),
    removeEventListener: vi.fn<MediaQueryList['removeEventListener']>(),
  }));
  const { default: AppDrawer } = await import('./index');
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<AppDrawer />}>
          <Route path="*" element={<Page />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  await act(() => vi.dynamicImportSettled());
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('closes mobile navigation for same-page and security links without closing menu groups', async () => {
  await renderLayout();
  const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(trigger);
  const sidebar = await screen.findByRole('dialog', { name: 'Sidebar' });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const group = within(sidebar).getByRole('button', { name: /Bookmarks$/ });
  fireEvent.click(group);
  expect(sidebar).toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded', 'true');

  fireEvent.click(within(sidebar).getByRole('link', { name: 'Home' }));
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sidebar' })).not.toBeInTheDocument());

  fireEvent.click(trigger);
  const reopened = await screen.findByRole('dialog', { name: 'Sidebar' });
  fireEvent.click(within(reopened).getByRole('link', { name: 'Security settings' }));
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  expect(await screen.findByRole('heading', { name: '/settings/security' })).toBeInTheDocument();
});

it('keeps nested settings dialogs usable and restores focus when the sidebar closes', async () => {
  await renderLayout();
  const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
  trigger.focus();
  fireEvent.click(trigger);
  const sidebar = await screen.findByRole('dialog', { name: 'Sidebar' });
  const settings = within(sidebar).getByRole('button', { name: 'Language Setting' });
  settings.focus();
  fireEvent.click(settings);
  const dialog = await screen.findByRole('dialog', { name: 'Language Setting' });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(settings).toHaveFocus());
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  await waitFor(() => expect(trigger).toHaveFocus());
});

it('preserves the desktop sidebar state when navigating', async () => {
  await renderLayout(1280);
  const trigger = screen.getByRole('button', { name: 'Toggle sidebar' });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(screen.getByRole('link', { name: 'Security settings' }));
  expect(await screen.findByRole('heading', { name: '/settings/security' })).toBeInTheDocument();
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
});
