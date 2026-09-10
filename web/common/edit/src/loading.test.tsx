import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { expect, it, vi } from 'vitest';
import CustomEdit from './FormEditor';

const load = vi.hoisted(() => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve, focus: vi.fn<() => void>() };
});
vi.mock('./MonacoEditor', async () => {
  await load.promise;
  const { useImperativeHandle } = await import('react');
  return {
    default: function MockEditor(props: { code: string; ref: React.Ref<{ focus: () => void }> }) {
      useImperativeHandle(props.ref, () => ({ focus: load.focus }), []);
      return <output data-testid="loaded-editor">{props.code}</output>;
    },
  };
});

it('keeps a controlled draft and queued form focus across delayed editor loading', async () => {
  const ref = createRef<{ focus: () => void; value: string }>();
  function Form() {
    const [value, setValue] = useState('initial');
    return <CustomEdit ref={ref} aria-label="Content" value={value} onChange={setValue} />;
  }
  const view = render(<Form />);
  const fallback = screen.getByRole('textbox', { name: 'Content' });
  fireEvent.change(fallback, { target: { value: 'draft while loading' } });
  act(() => ref.current?.focus());
  expect(fallback).toHaveFocus();
  expect(ref.current?.value).toBe('draft while loading');
  await act(async () => {
    load.resolve();
    await load.promise;
  });
  expect(await screen.findByTestId('loaded-editor')).toHaveTextContent('draft while loading');
  expect(load.focus).toHaveBeenCalled();
  view.unmount();
  expect(ref.current).toBeNull();
});
