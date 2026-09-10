import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createCustomColumnHelper, CustomTable, type CustomColumnDefArray } from './index';

type Item = { id: number; name: string };
const columns: CustomColumnDefArray<Item> = [
  { accessorKey: 'name', header: 'Name', cell: (context) => context.getValue() as string },
];

function ItemList({ items }: { items: Item[] }) {
  return <CustomTable options={{ columns, data: items }} />;
}

afterEach(cleanup);

it('renders refreshed values for the same row and removes deleted rows under React Compiler', () => {
  const view = render(<ItemList items={[{ id: 5, name: 'Original' }]} />);
  expect(screen.getByRole('cell', { name: 'Original' })).toBeInTheDocument();

  view.rerender(<ItemList items={[{ id: 5, name: 'Saved edit' }]} />);
  expect(screen.getByRole('cell', { name: 'Saved edit' })).toBeInTheDocument();
  expect(screen.queryByRole('cell', { name: 'Original' })).not.toBeInTheDocument();

  view.rerender(<ItemList items={[]} />);
  expect(screen.queryByRole('cell')).not.toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
});

it('refreshes translated headers and action callbacks even when the data reference is unchanged', () => {
  const helper = createCustomColumnHelper<Item>();
  const items = [{ id: 1, name: 'One' }];
  function Actions({ label, onAction }: { label: string; onAction: (id: number) => void }) {
    const columns = helper.columns([
      helper.accessor('name', { header: label }),
      helper.display({
        id: 'actions',
        cell: ({ row }) => <button onClick={() => onAction(row.original.id)}>{label}</button>,
      }),
    ]);
    return <CustomTable options={{ columns, data: items }} />;
  }
  const before = vi.fn<(id: number) => void>();
  const after = vi.fn<(id: number) => void>();
  const view = render(<Actions label="Edit" onAction={before} />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  view.rerender(<Actions label="编辑" onAction={after} />);
  expect(screen.getByRole('columnheader', { name: '编辑' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '编辑' }));
  expect(before).toHaveBeenCalledExactlyOnceWith(1);
  expect(after).toHaveBeenCalledExactlyOnceWith(1);
});
