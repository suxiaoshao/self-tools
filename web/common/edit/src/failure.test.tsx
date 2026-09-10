import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import CustomEdit from './FormEditor';

vi.mock('./MonacoEditor', () => {
  throw new Error('simulated chunk load failure');
});

it('keeps the same editable draft when the editor chunk fails and respects readOnly', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  function Form({ readOnly = false }: { readOnly?: boolean }) {
    const [value, setValue] = useState('saved draft');
    return <CustomEdit aria-label="Content" value={value} onChange={setValue} readOnly={readOnly} />;
  }
  const view = render(<Form />);
  const fallback = await screen.findByRole('textbox', { name: 'Content' });
  fireEvent.change(fallback, { target: { value: 'keep editing' } });
  expect(await screen.findByRole('textbox', { name: 'Content' })).toHaveValue('keep editing');
  view.rerender(<Form readOnly />);
  expect(screen.getByRole('textbox', { name: 'Content' })).toHaveAttribute('readonly');
  view.unmount();
  error.mockRestore();
});
