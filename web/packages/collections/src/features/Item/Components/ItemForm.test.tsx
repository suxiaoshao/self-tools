import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog } from '@portal/components/ui/dialog';
import ItemForm, { type ItemCreateData, type ItemEditData } from './ItemForm';
import type { WriteOutcome } from 'custom-graphql';

vi.mock('i18n', () => ({ useI18n: () => (key: string) => key }));
vi.mock('../../../components/CustomEdit', () => ({
  default: ({ value, onChange, readOnly }: { value: string; onChange: (value: string) => void; readOnly: boolean }) => (
    <textarea aria-label="content" value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('../../../components/Markdown', () => ({ default: () => null }));
vi.mock('@collections/components/CollectionMultiSelect', () => ({
  default: ({ value }: { value: number[] }) => <output aria-label="collections">{value.join(',')}</output>,
}));
afterEach(cleanup);

it('initializes once per edit session and never replaces a draft on parent refresh', async () => {
  const submit = vi
    .fn<(data: ItemEditData) => Promise<WriteOutcome>>()
    .mockResolvedValue({ status: 'rejected', rejection: { kind: 'validation', issues: [] } });
  const close = vi.fn<() => void>();
  const form = (key: string, name: string) => (
    <Dialog open>
      <ItemForm
        key={key}
        mode="edit"
        initialValues={{ name, content: 'body' }}
        afterSubmit={submit}
        handleClose={close}
        checkResult={async () => false}
      />
    </Dialog>
  );
  const view = render(form('first', 'original'));
  fireEvent.change(screen.getByDisplayValue('original'), { target: { value: 'draft' } });
  view.rerender(form('first', 'background update'));
  expect(screen.getByDisplayValue('draft')).toBeInTheDocument();
  expect(screen.queryByLabelText('collections')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('submit'));
  await waitFor(() => expect(submit).toHaveBeenCalledExactlyOnceWith({ name: 'draft', content: 'body' }));
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue('draft')).toBeInTheDocument();
  view.rerender(form('second', 'reopened'));
  expect(screen.getByDisplayValue('reopened')).toBeInTheDocument();
});

describe('submission ownership', () => {
  it('blocks duplicate writes, locks the draft, and checks the submitted snapshot', async () => {
    let finish!: (result: WriteOutcome) => void;
    const submit = vi.fn<(data: ItemEditData) => Promise<WriteOutcome>>(
      () =>
        new Promise<WriteOutcome>((resolve) => {
          finish = resolve;
        }),
    );
    const close = vi.fn<() => void>();
    const check = vi.fn<(data: ItemEditData) => Promise<boolean>>(async () => true);
    const view = render(
      <Dialog open>
        <ItemForm
          mode="edit"
          initialValues={{ name: 'original', content: 'body' }}
          afterSubmit={submit}
          handleClose={close}
          checkResult={check}
        />
      </Dialog>,
    );
    fireEvent.change(screen.getByDisplayValue('original'), { target: { value: 'submitted' } });
    fireEvent.click(screen.getByText('submit'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('textbox', { name: 'content' })).toHaveAttribute('readonly');
    expect(screen.getByDisplayValue('submitted')).toBeDisabled();
    fireEvent.click(screen.getByText('submit'));
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () => finish({ status: 'failed', failure: { kind: 'network' }, unconfirmed: true }));
    // Even programmatic input changes must not change the reconciliation target.
    fireEvent.change(screen.getByDisplayValue('submitted'), { target: { value: 'later value' } });
    fireEvent.click(screen.getByText('request_check_result'));
    await waitFor(() => expect(check).toHaveBeenCalledExactlyOnceWith({ name: 'submitted', content: 'body' }));
    expect(close).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('does not close another session when an unmounted editor finishes', async () => {
    let finish!: (result: WriteOutcome) => void;
    const submit = vi.fn<(data: ItemEditData) => Promise<WriteOutcome>>(
      () =>
        new Promise<WriteOutcome>((resolve) => {
          finish = resolve;
        }),
    );
    const close = vi.fn<() => void>();
    const view = render(
      <Dialog open>
        <ItemForm
          mode="edit"
          initialValues={{ name: 'old', content: 'body' }}
          afterSubmit={submit}
          handleClose={close}
          checkResult={async () => false}
        />
      </Dialog>,
    );
    fireEvent.click(screen.getByText('submit'));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => finish({ status: 'saved' }));
    expect(close).not.toHaveBeenCalled();
  });

  it('includes initial memberships only when creating', async () => {
    const submit = vi.fn<(data: ItemCreateData) => Promise<WriteOutcome>>(async () => ({ status: 'saved', id: 1 }));
    render(
      <Dialog open>
        <ItemForm
          mode="create"
          initialValues={{ name: 'new', content: 'body', collectionIds: [3, 8] }}
          afterSubmit={submit}
          handleClose={() => undefined}
        />
      </Dialog>,
    );
    fireEvent.click(screen.getByText('submit'));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledExactlyOnceWith({ name: 'new', content: 'body', collectionIds: [3, 8] }),
    );
  });
});
