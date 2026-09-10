import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { CollectionMultiSelect } from './CollectionMultiSelect';
import { CollectionSelect } from './CollectionSelect';
import type { CollectionOption } from './tree';

vi.mock('i18n', () => ({
  useI18n: () => (key: string, values?: { name?: string }) => (values?.name ? `${key} ${values.name}` : key),
}));
afterEach(cleanup);
const options = new Map<number, CollectionOption>([
  [3, { id: 3, parentId: 1, name: 'Child', path: '/Root/Child' }],
  [2, { id: 2, name: 'Other', path: '/Other' }],
  [1, { id: 1, parentId: null, name: 'Root', path: '/Root' }],
  [4, { id: 4, parentId: 3, name: 'Grand', path: '/Root/Child/Grand' }],
  [5, { id: 5, parentId: 4, name: 'Deep', path: '/Root/Child/Grand/Deep' }],
  [6, { id: 6, parentId: 5, name: 'Child', path: '/Root/Child/Grand/Deep/Child' }],
  [7, { id: 7, parentId: 2, name: 'Child', path: '/Other/Child' }],
]);
const browse = (path: string) => fireEvent.click(screen.getByRole('button', { name: `browse_collection ${path}` }));
const confirm = () => fireEvent.click(screen.getByRole('button', { name: 'confirm_selection' }));
const close = async () => waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

it('separates browsing from selecting a parent and commits only after confirmation', async () => {
  const onChange = vi.fn<(value: number | null) => void>();
  const { container } = render(
    <CollectionSelect allCollections={options} value={2} onChange={onChange} errorMessage="Required" />,
  );
  const trigger = screen.getByRole('button', { name: 'select_collection' });
  expect(trigger).toHaveAccessibleDescription('Required');
  fireEvent.click(trigger);
  const roots = container.ownerDocument.querySelector('[data-slot="collection-columns"] ul')!;
  expect(
    within(roots as HTMLElement)
      .getAllByRole('radio')
      .map((node) => node.getAttribute('aria-label')),
  ).toEqual(['/Other', '/Root']);
  browse('/Root');
  expect(screen.getByRole('radio', { name: '/Root/Child' })).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('radio', { name: '/Root' }));
  expect(onChange).not.toHaveBeenCalled();
  confirm();
  expect(onChange).toHaveBeenCalledExactlyOnceWith(1);
  await close();
  await waitFor(() => expect(trigger).toHaveFocus());
});

it('advances the three-column window beyond three levels and returns through breadcrumbs', async () => {
  render(<CollectionSelect allCollections={options} value={null} onChange={vi.fn<(value: number | null) => void>()} />);
  fireEvent.click(screen.getByRole('button', { name: 'select_collection' }));
  for (const path of ['/Root', '/Root/Child', '/Root/Child/Grand', '/Root/Child/Grand/Deep']) browse(path);
  expect(document.querySelector('[data-slot="collection-columns"]')?.children).toHaveLength(3);
  expect(screen.getByRole('radio', { name: '/Root/Child/Grand/Deep/Child' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Root' }));
  expect(screen.getByRole('radio', { name: '/Root/Child' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'back' }));
  expect(screen.getByRole('button', { name: 'back' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: '/Other' })).toBeInTheDocument();
});

it('preserves cross-level drafts, disambiguates paths in search and deduplicates confirmed ids', async () => {
  const changed = vi.fn<(value: number[] | null | undefined) => void>();
  function Harness() {
    const [value, setValue] = useState<number[]>([2, 2]);
    return (
      <CollectionMultiSelect
        allCollections={options}
        value={value}
        onChange={(next) => {
          changed(next);
          setValue(next ?? []);
        }}
      />
    );
  }
  const { container } = render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'add_collection' }));
  browse('/Root');
  fireEvent.click(screen.getByRole('checkbox', { name: '/Root/Child' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'search_collections' }), { target: { value: 'Child' } });
  const results = screen.getByRole('region', { name: 'collection_search_results' });
  expect(within(results).getAllByRole('checkbox')).toHaveLength(5);
  fireEvent.click(within(results).getByRole('checkbox', { name: '/Other/Child' }));
  expect(changed).not.toHaveBeenCalled();
  confirm();
  expect(changed).toHaveBeenLastCalledWith([2, 3, 7]);
  await close();
  fireEvent.click(within(container).getByRole('button', { name: 'remove_association /Other' }));
  expect(changed).toHaveBeenLastCalledWith([3, 7]);
});

it('discards cancelled drafts and initializes each opening from the current caller value', async () => {
  const onChange = vi.fn<(value: number[] | null | undefined) => void>();
  const view = render(<CollectionMultiSelect allCollections={options} value={[2]} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: 'add_collection' }));
  fireEvent.click(screen.getByRole('checkbox', { name: '/Root' }));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
  await close();
  expect(onChange).not.toHaveBeenCalled();
  view.rerender(<CollectionMultiSelect allCollections={options} value={[1]} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: 'add_collection' }));
  expect(screen.getByRole('checkbox', { name: '/Root' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: '/Other' })).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'remove_association /Root' }));
  confirm();
  expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
});

it('closes the picker when disabled and prevents both removal and adding', async () => {
  const onChange = vi.fn<(value: number[] | null | undefined) => void>();
  const { container, rerender } = render(
    <CollectionMultiSelect allCollections={options} value={[2]} onChange={onChange} />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'add_collection' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  rerender(<CollectionMultiSelect allCollections={options} value={[2]} onChange={onChange} disabled />);
  await close();
  for (const button of within(container).getAllByRole('button')) {
    expect(button).toBeDisabled();
    fireEvent.click(button);
  }
  expect(onChange).not.toHaveBeenCalled();
});
