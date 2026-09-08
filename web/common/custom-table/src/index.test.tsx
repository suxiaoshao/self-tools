import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { CustomTable, type CustomColumnDefArray, getCoreRowModel } from './index';

type Item = { id: number; name: string };
const columns: CustomColumnDefArray<Item> = [
  { accessorKey: 'name', header: 'Name', cell: (context) => context.getValue() as string },
];

function ItemList({ items }: { items: Item[] }) {
  return <CustomTable options={{ columns, data: items, getCoreRowModel: getCoreRowModel() }} />;
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
