import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useWriteAction, hasQueryFailure } from './feedback';
import { CombinedGraphQLErrors } from '@apollo/client';

describe('write recovery', () => {
  it('blocks a replay while unconfirmed and retains uncertainty when the read fails', async () => {
    const { result } = renderHook(useWriteAction);
    await act(async () => {
      await result.current.run(async () => ({ status: 'failed', failure: { kind: 'network' }, unconfirmed: true }));
    });
    expect(result.current.blocked).toBe(true);
    let requests = 0;
    await act(async () => {
      await result.current.run(async () => {
        requests++;
        return { status: 'saved' };
      });
    });
    expect(requests).toBe(0);
    await act(async () => {
      expect(
        await result.current.check(async () => {
          throw new Error('private response');
        }),
      ).toBe(false);
    });
    expect(result.current.blocked).toBe(true);
    await act(async () => {
      expect(await result.current.check(async () => true)).toBe(true);
    });
    expect(result.current.outcome?.status).toBe('saved');
  });
  it('isolates association failures from siblings', () => {
    const error = new CombinedGraphQLErrors({
      errors: [{ message: 'do not display', path: ['getItem', 'collections'] }],
    });
    expect(hasQueryFailure(error, ['getItem', 'collections'])).toBe(true);
    expect(hasQueryFailure(error, ['getItem', 'content'])).toBe(false);
  });
});
