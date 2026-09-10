import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import TablePagination from './TablePagination';
import { usePage } from './usePage';

vi.mock('i18n', () => ({ useI18n: () => (key: string) => key }));
afterEach(cleanup);

it('keeps one-based server pagination when searching pages and changing page size', async () => {
  function Pager() {
    const page = usePage();
    return (
      <>
        <output aria-label="page-state">
          {page.pageIndex}:{page.offset}:{page.limit}
        </output>
        <TablePagination {...page} total={95} />
      </>
    );
  }
  render(<Pager />);
  expect(screen.getByRole('button', { name: 'go_to_previous_page' })).toBeDisabled();
  const input = screen.getByRole('combobox', { name: 'search_page' });
  act(() => input.focus());
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.change(input, { target: { value: '3' } });
  fireEvent.click(await screen.findByRole('option', { name: '3' }));
  expect(screen.getByLabelText('page-state')).toHaveTextContent('3:20:10');
  fireEvent.click(screen.getByRole('button', { name: 'go_to_next_page' }));
  expect(screen.getByLabelText('page-state')).toHaveTextContent('4:30:10');
  fireEvent.click(screen.getByRole('combobox', { name: 'table_pagination_row_per_page' }));
  const size = await screen.findByRole('option', { name: '20' });
  fireEvent.pointerDown(size, { pointerType: 'mouse' });
  fireEvent.click(size);
  await waitFor(() => expect(screen.getByLabelText('page-state')).toHaveTextContent('4:60:20'));
});
