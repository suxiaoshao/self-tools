import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render as testingRender, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SidebarProvider } from 'ui/components/sidebar';
import { CollectionMultiSelect } from './CollectionMultiSelect';
import { CollectionSelect } from './CollectionSelect';
import { buildCollectionTree, type CollectionOption } from './tree';

vi.mock('i18n', () => ({ useI18n: () => (key: string) => key }));
afterEach(cleanup);
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn<() => void>(), removeEventListener: vi.fn<() => void>() })),
  );
});
function render(ui: ReactElement) {
  return testingRender(ui, { wrapper: ({ children }) => <SidebarProvider>{children}</SidebarProvider> });
}
const options = new Map<number, CollectionOption>([
  [3, { id: 3, parentId: 1, name: 'Child', path: '/Root/Child' }],
  [2, { id: 2, name: 'Other', path: '/Other' }],
  [1, { id: 1, parentId: null, name: 'Root', path: '/Root' }],
]);

describe('shared collection selection', () => {
  it('preserves sibling order, paths and the root grouping without mutating its snapshot', () => {
    const source = [...options.values(), { id: 9, parentId: 99, name: 'Orphan', path: '/Missing/Orphan' }];
    const tree = buildCollectionTree(source);
    expect(tree.map((node) => node.id)).toEqual([2, 1]);
    expect(tree[1]?.children.map((node) => node.path)).toEqual(['/Root/Child']);
    expect(source[0]).not.toHaveProperty('children');
  });

  it('selects the same id on repeated clicks and selects nested paths', () => {
    const onChange = vi.fn<(value: number | number[] | null | undefined) => void>();
    render(<CollectionSelect allCollections={options} value={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '/Other' }));
    fireEvent.click(screen.getByRole('button', { name: '/Root/Child' }));
    expect(onChange.mock.calls).toEqual([[2], [3]]);
  });

  it('deduplicates added ids, appends new choices and removes only the selected id', async () => {
    const changed = vi.fn<(value: number[] | null | undefined) => void>();
    function Harness() {
      const [value, setValue] = useState<number[]>([2]);
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
    const open = () => fireEvent.click(container.querySelector('button[data-slot="popover-trigger"]')!);
    open();
    fireEvent.click(screen.getByRole('button', { name: '/Other' }));
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'submit' })).not.toBeInTheDocument());
    expect(changed).not.toHaveBeenCalled();
    open();
    fireEvent.click(screen.getByRole('button', { name: '/Root/Child' }));
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(changed).toHaveBeenLastCalledWith([2, 3]));
    fireEvent.click(within(container.querySelector('[data-slot="badge"]') as HTMLElement).getByRole('button'));
    expect(changed).toHaveBeenLastCalledWith([3]);
  });

  it('disables removal and adding, and hides an already open picker when disabled', () => {
    const onChange = vi.fn<(value: number | number[] | null | undefined) => void>();
    const { container, rerender } = render(
      <CollectionMultiSelect allCollections={options} value={[2]} onChange={onChange} />,
    );
    fireEvent.click(container.querySelector('button[data-slot="popover-trigger"]')!);
    expect(screen.getByRole('button', { name: 'submit' })).toBeInTheDocument();
    rerender(<CollectionMultiSelect allCollections={options} value={[2]} onChange={onChange} disabled />);
    for (const button of within(container).getAllByRole('button')) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(screen.queryByRole('button', { name: 'submit' })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
